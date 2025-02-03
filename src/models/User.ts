import mongoose, { models } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  role: "SOCIETY" | "EM" | "TECH";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["SOCIETY", "EM", "TECH"],
      required: true,
    },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", UserSchema);
export default User;
