import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  interests: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>(
  "User",
  UserSchema
);
