import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImage extends Document {
  title: string;
  url: string;
  publicId?: string; // for Cloudinary
  createdAt: Date;
}

const ImageSchema: Schema<IImage> = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ImageModel: Model<IImage> =
  mongoose.models.Image || mongoose.model<IImage>("Image", ImageSchema);
