"use server";

import { getMyServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "users", "list"))
      throw new Error("Unauthorized");

    await connectDB();
    const users = await User.find({}).select("-password");
    return { success: true, data: JSON.stringify(users) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function getUser(userId: string) {
  try {
    const session = await getMyServerSession();
    await connectDB();

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }
    if (!hasPermission(session.user, "users", "view", user))
      throw new Error("Unauthorized");

    return { success: true, data: user };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function addUser(formData: FormData) {
  try {
    const session = await getMyServerSession();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    if (!email || !password || !role) {
      throw new Error("All fields are required");
    }
    if (!hasPermission(session.user, "users", "create", { email, role }))
      throw new Error("Unauthorized");

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
    const session = await getMyServerSession();

    await connectDB();

    const userId = formData.get("userId") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("password") as string | null;

    if (!userId || !email || !role) {
      throw new Error("Required fields are missing");
    }

    const existingUser = await User.findById(userId).select("-password");
    if (!hasPermission(session.user, "users", "update", existingUser))
      throw new Error("Unauthorized");

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

    revalidatePath("/dashboard/users");
    return { success: true, data: JSON.stringify(updatedUser) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function deleteUser(formData: FormData) {
  try {
    const session = await getMyServerSession();
    await connectDB();

    const userId = formData.get("userId") as string;
    if (!userId) {
      throw new Error("User ID is required");
    }

    const deletedUser = await User.findByIdAndDelete(userId).select(
      "-password"
    );
    if (!deletedUser) {
      throw new Error("User not found");
    }

    if (!hasPermission(session.user, "users", "delete", deletedUser)) {
      await User.create(deletedUser);
      throw new Error("Unauthorized");
    }

    revalidatePath("/dashboard/users");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function updateUserPassword(formData: FormData) {
  try {
    const session = await getMyServerSession();
    if (!session?.user) {
      throw new Error("Unauthorized - No session found");
    }

    const userId = session.user.id;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword) {
      throw new Error("Required fields are missing");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    await connectDB();

    const existingUser = await User.findById(userId).select("password role");
    if (!existingUser) {
      throw new Error("User not found");
    }

    if (
      !(await hasPermission(
        session.user,
        "users",
        "updatePassword",
        existingUser
      ))
    ) {
      throw new Error("Unauthorized - Insufficient permissions");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHashed = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: newPasswordHashed },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/settings");

    return { success: true, data: JSON.stringify(updatedUser) };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function searchUsers(query: string, role: Role | undefined) {
  try {
    const session = await getMyServerSession();
    if (!hasPermission(session.user, "users", "list"))
      throw new Error("Unauthorized");

    await connectDB();

    const searchConditions: any = {
      email: { $regex: query, $options: "i" },
    };

    if (role) {
      searchConditions.role = role;
    }

    const users = await User.find(searchConditions).select("-password");
    return { success: true, data: JSON.stringify(users) };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
