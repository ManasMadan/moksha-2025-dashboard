import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "SME", "QC", "REVIEWER"],
    required: true,
  },
}, { timestamps: true });

const User = models.User || mongoose.model("User", userSchema);
export default User;