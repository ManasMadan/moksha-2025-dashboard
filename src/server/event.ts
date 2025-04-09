"use server";

import { getMyServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import Event from "@/models/Event";
import { revalidatePath } from "next/cache";
import { Client } from "minio";
import { randomUUID } from "crypto";
import EventRegistration from "@/models/EventRegistration";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "443"),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
  region: process.env.MINIO_REGION || "",
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "eventimages";

async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, process.env.MINIO_REGION || "");
  }
}

async function uploadImageToMinio(imageData: string): Promise<string> {
  try {
    await ensureBucketExists();

    // Extract base64 data
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image data format");
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const extension = type.split("/")[1];
    const fileName = `${randomUUID()}.${extension}`;

    await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      "Content-Type": type,
    });

    return fileName;
  } catch (error) {
    console.error("Error uploading to MinIO:", error);
    throw new Error("Failed to upload image");
  }
}

export async function getEvents() {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "list"))
      throw new Error("Unauthorized");

    await connectDB();
    const events = await Event.find({}).populate({
      path: "owner",
      select: "-password",
    });
    return { success: true, data: JSON.stringify(events) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getMyEvents() {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "list"))
      throw new Error("Unauthorized");

    await connectDB();
    const events = await Event.find({ owner: session.user.id }).select(
      "-owner"
    );

    return { success: true, data: events };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function addEvent(formData: FormData) {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "create"))
      throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const owner = formData.get("owner") as string;
    const day = Number(formData.get("day"));
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const venue = formData.get("venue") as string;
    const category = formData.get("category") as string;

    if (
      !name ||
      !owner ||
      !day ||
      !startTime ||
      !endTime ||
      !venue ||
      !category
    ) {
      throw new Error("All fields are required");
    }

    await connectDB();

    const existingEvent = await Event.findOne({
      name,
      day,
      startTime,
      endTime,
      venue,
      category,
    });

    if (existingEvent) {
      throw new Error("Similar event already exists");
    }

    const event = await Event.create({
      name,
      owner,
      day,
      startTime,
      endTime,
      venue,
      category,
    });

    revalidatePath("/dashboard/events");
    return { success: true, message: "Event created successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function updateEvent(formData: FormData) {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "update"))
      throw new Error("Unauthorized");

    await connectDB();

    const eventId = formData.get("eventId") as string;
    const name = formData.get("name") as string;
    const owner = formData.get("owner") as string;
    const day = Number(formData.get("day"));
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const venue = formData.get("venue") as string;
    const category = formData.get("category") as string;
    if (
      !eventId ||
      !name ||
      !owner ||
      !day ||
      !startTime ||
      !endTime ||
      !venue ||
      !category
    ) {
      throw new Error("Required fields are missing");
    }

    const existingEvent = await Event.findOne({
      $and: [
        { _id: { $ne: eventId } },
        { name, day, startTime, endTime, venue, category },
      ],
    });

    if (existingEvent) {
      throw new Error("Similar event already exists");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        name,
        owner,
        day,
        startTime,
        endTime,
        venue,
        category,
      },
      { new: true }
    );

    if (!updatedEvent) {
      throw new Error("Event not found");
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: JSON.stringify(updatedEvent) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function updateEventSociety(formData: FormData) {
  try {
    const session = await getMyServerSession();
    const eventId = formData.get("eventId") as string;

    await connectDB();
    const event = await Event.findById(eventId);
    if (!hasPermission(session.user, "events", "update_soc", event))
      throw new Error("Unauthorized");

    const acceptingRegistrations =
      formData.get("acceptingRegistrations") === "true";
    const imageData = formData.get("imageData") as string;
    const description = formData.get("description") as string;
    const isTeamEvent = formData.get("isTeamEvent") === "true";
    const minNumberOfTeamMembers = Number(
      formData.get("minNumberOfTeamMembers")
    );
    const maxNumberOfTeamMembers = Number(
      formData.get("maxNumberOfTeamMembers")
    );
    const customInputs = JSON.parse(formData.get("customInputs") as string);

    if (
      !eventId ||
      !description ||
      !minNumberOfTeamMembers ||
      !maxNumberOfTeamMembers
    ) {
      throw new Error("Required fields are missing");
    }

    // Handle image upload
    let imageKey = event?.imageKey; // Maintain existing image if not changed

    if (imageData && imageData !== event?.imageKey) {
      // If image data is provided and different from existing key
      if (imageData.startsWith("data:")) {
        // It's a new image, upload to MinIO
        imageKey = await uploadImageToMinio(imageData);
      } else {
        // It's the existing MinIO key or empty
        imageKey = imageData;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        acceptingRegistrations,
        imageKey, // Store MinIO object key instead of base64 data
        description,
        isTeamEvent,
        minNumberOfTeamMembers,
        maxNumberOfTeamMembers,
        customInputs,
      },
      { new: true }
    );

    if (!updatedEvent) {
      throw new Error("Event not found");
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: JSON.stringify(updatedEvent) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function deleteEvent(formData: FormData) {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "delete"))
      throw new Error("Unauthorized");

    await connectDB();

    const eventId = formData.get("eventId") as string;

    if (!eventId) {
      throw new Error("Event ID is required");
    }

    // Get the event first to retrieve the image key
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Delete the associated image from MinIO if it exists
    if (event.imageKey) {
      try {
        await minioClient.removeObject(BUCKET_NAME, event.imageKey);
      } catch (error) {
        console.error("Failed to delete image from MinIO:", error);
        // Continue with event deletion even if image deletion fails
      }
    }

    // Now delete the event from MongoDB
    await Event.findByIdAndDelete(eventId);

    revalidatePath("/dashboard/events");
    return { success: true, message: "Event deleted successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getEventById(id: string) {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "events", "view"))
      throw new Error("Unauthorized");

    await connectDB();
    const event = await Event.findById(id);

    if (!event) {
      throw new Error("Event not found");
    }

    // If the event has an image key, generate a presigned URL to access it
    if (event.imageKey) {
      try {
        const presignedUrl = await minioClient.presignedGetObject(
          BUCKET_NAME,
          event.imageKey,
          24 * 60 * 60 // URL valid for 24 hours
        );

        // Add the URL to the event data
        const eventObj = event.toObject();
        eventObj.imageUrl = presignedUrl;

        return { success: true, data: JSON.stringify(eventObj) };
      } catch (error) {
        console.error("Failed to generate presigned URL:", error);
        // Return the event without the image URL if there's an error
        return { success: true, data: JSON.stringify(event) };
      }
    }

    return { success: true, data: JSON.stringify(event) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getEventRegById(id: string) {
  try {
    const session = await getMyServerSession();
    const event = await Event.findById(id);
    if (!hasPermission(session.user, "events", "view_registrations", event))
      throw new Error("Unauthorized");

    await connectDB();
    const registrations = await EventRegistration.find({ eventId: id })
      .populate({
        path: "eventId",
        model: "Event",
        select:
          "name day startTime endTime venue category description customInputs",
      })
      .exec();

    if (!registrations) {
      throw new Error("Registrations not found");
    }

    return { success: true, data: JSON.stringify(registrations) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
