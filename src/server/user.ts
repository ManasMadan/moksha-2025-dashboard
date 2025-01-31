"use server";

import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

async function checkAdminAuthorization() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== ROLES.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function getUsers() {
  try {
    await checkAdminAuthorization();
    await connectDB();

    const users = await User.find({}).select("-password");
    return { success: true, data: JSON.stringify(users) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getUser(userId: string) {
  try {
    await checkAdminAuthorization();
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
    await checkAdminAuthorization();

    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!username || !email || !password || !role) {
      throw new Error("All fields are required");
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    console.log(user);

    return { success: true, message: "User registered successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function updateUser(formData: FormData) {
  try {
    await checkAdminAuthorization();
    await connectDB();

    const userId = formData.get("userId") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("password") as string | null;

    if (!userId || !username || !email || !role) {
      throw new Error("Required fields are missing");
    }

    const existingUser = await User.findOne({
      $and: [{ _id: { $ne: userId } }, { $or: [{ email }, { username }] }],
    });

    if (existingUser) {
      throw new Error("Username or email already exists");
    }

    const updateData: {
      username: string;
      email: string;
      role: string;
      password?: string;
    } = {
      username,
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
    await checkAdminAuthorization();
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
