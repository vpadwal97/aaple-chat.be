import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  roomId: string;

  participants: string[];

  isRandom: boolean;

  startedAt: Date;

  endedAt?: Date;
}

const ConversationSchema =
  new Schema<IConversation>(
    {
      roomId: {
        type: String,
        required: true,
        unique: true,
      },

      participants: {
        type: [String],
        required: true,
      },

      isRandom: {
        type: Boolean,
        default: true,
      },

      startedAt: {
        type: Date,
        default: Date.now,
      },

      endedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
