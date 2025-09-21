import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMember extends Document {
  name: string;
  role: "Founder" | "Co-Founder" | "Partner" | "Co-Partner" | "Core" | "Technology" | "Developer" | "Volunteer" | "Advisor";
  bio?: string;
  photoUrl?: string;
  instaId?: string;
  email?: string;
  contact?: string;
  position: number;
  createdAt: Date;
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Founder",
        "Co-Founder",
        "Partner",
        "Co-Partner",
        "Core",
        "Technology",
        "Developer",
        "Volunteer",
        "Advisor",
      ],
      default: "Core",
    },
    bio: { type: String },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    instaId: { type: String },
    email: { type: String },
    contact: { type: String },
    position: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const MemberModel: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
