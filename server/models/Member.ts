import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMember extends Document {
  name: string;
  role: "Founder" | "Partner" | "Core";
  bio?: string;
  photoUrl?: string;
  instaId?: string;
  email?: string;
  contact?: string;
  createdAt: Date;
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["Founder", "Partner", "Core"],
      default: "Core",
    },
    bio: { type: String },
    photoUrl: { type: String },
    instaId: { type: String },
    email: { type: String },
    contact: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const MemberModel: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
