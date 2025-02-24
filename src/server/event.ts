"use server";

import { getMyServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import Event from "@/models/Event";
import { revalidatePath } from "next/cache";

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

    if (!name || !owner || !day || !startTime || !endTime) {
      throw new Error("All fields are required");
    }

    await connectDB();

    const existingEvent = await Event.findOne({
      name,
      day,
      startTime,
      endTime,
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

    if (!eventId || !name || !owner || !day || !startTime || !endTime) {
      throw new Error("Required fields are missing");
    }

    const existingEvent = await Event.findOne({
      $and: [{ _id: { $ne: eventId } }, { name, day, startTime, endTime }],
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

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        acceptingRegistrations,
        imageData,
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

    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      throw new Error("Event not found");
    }

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

    return { success: true, data: JSON.stringify(event) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
