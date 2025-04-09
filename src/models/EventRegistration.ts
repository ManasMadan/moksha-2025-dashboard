import mongoose, { Document } from "mongoose";

export interface ITeamMember {
  name: string;
  age: string;
  college: string;
  email: string;
  phone: string;
  yearOfPassing: string;
}

export interface ICustomInputValue {
  inputId: mongoose.Types.ObjectId;
  value: string;
  fileUrl?: string;
}

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamName: string;
  teamMembers: ITeamMember[];
  customInputValues: ICustomInputValue[];
  registrationDate: Date;
}

const EventRegistrationSchema = new mongoose.Schema<IEventRegistration>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: {
      type: String,
      trim: true,
    },
    teamMembers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        age: {
          type: String,
          required: true,
          trim: true,
        },
        college: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          trim: true,
        },
        yearOfPassing: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    customInputValues: [
      {
        inputId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        value: {
          type: String,
          trim: true,
        },
        fileUrl: {
          type: String,
          trim: true,
        },
      },
    ],
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", EventRegistrationSchema);

export default EventRegistration;
