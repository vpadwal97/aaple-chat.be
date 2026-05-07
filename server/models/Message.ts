import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  roomId: string;

  sender: string;

  text: string;

  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessage>(
  "Message",
  MessageSchema
);
