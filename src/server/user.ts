"use server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  try {
    await connectDB();

    const users = await User.find({}).select("-password");
    return { success: true, data: JSON.stringify(users) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getUser(userId: string) {
  try {
    await connectDB();

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    return { success: true, data: user };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function addUser(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !role) {
      throw new Error("All fields are required");
    }

    await connectDB();

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    return { success: true, message: "User registered successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function updateUser(formData: FormData) {
  try {
    await connectDB();

    const userId = formData.get("userId") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("password") as string | null;

    if (!userId || !email || !role) {
      throw new Error("Required fields are missing");
    }

    const existingUser = await User.findOne({
      $and: [{ _id: { $ne: userId } }, { email }],
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const updateData: {
      email: string;
      role: string;
      password?: string;
    } = {
      email,
      role,
    };

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      throw new Error("User not found");
    }

    revalidatePath("/admin/users");
    return { success: true, data: JSON.stringify(updatedUser) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function deleteUser(formData: FormData) {
  try {
    await connectDB();

    const userId = formData.get("userId") as string;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new Error("User not found");
    }

    revalidatePath("/admin/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
