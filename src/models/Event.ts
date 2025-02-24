import mongoose, { Document } from "mongoose";

export interface IEvent extends Document {
  _id: string;
  name: string;
  owner: mongoose.Types.ObjectId;
  day: number;
  startTime: string;
  endTime: string;
  venue: string;
  acceptingRegistrations: boolean;
  imageData?: string;
  description: string;
  isTeamEvent: boolean;
  minNumberOfTeamMembers: number;
  maxNumberOfTeamMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new mongoose.Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    startTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    acceptingRegistrations: {
      type: Boolean,
      default: true,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    imageData: {
      type: String,
      default: "",
      required: false,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isTeamEvent: {
      type: Boolean,
      default: false,
    },
    minNumberOfTeamMembers: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxNumberOfTeamMembers: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
