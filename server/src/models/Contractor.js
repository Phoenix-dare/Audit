import mongoose from "mongoose";

const contractorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    entityType: { type: String, enum: ["Person", "Company"], default: "Person" },
    address: { type: String },
    gstNo: { type: String, sparse: true },
    panNo: { type: String, sparse: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Contractor", contractorSchema);
