import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDonor extends Document {
  name: string;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  logoUrl?: string;
  website?: string;
  donatedAmount?: number;
  donatedCommodity?: string;
  createdAt: Date;
}

const DonorSchema: Schema<IDonor> = new Schema(
  {
    name: { type: String, required: true },
    tier: {
      type: String,
      enum: ["Platinum", "Gold", "Silver", "Bronze"],
      required: true,
    },
    logoUrl: { type: String },
    website: { type: String },
    donatedAmount: { type: Number },
    donatedCommodity: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DonorModel: Model<IDonor> =
  mongoose.models.Donor || mongoose.model<IDonor>("Donor", DonorSchema);
