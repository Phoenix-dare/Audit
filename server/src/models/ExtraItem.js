import mongoose from "mongoose";

const extraItemSchema = new mongoose.Schema(
  {
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true },
    itemNo: { type: Number, required: true },
    description: { type: String },
    estimatedQty: { type: Number, required: true, min: 0 },
    actualQty: { type: Number, min: 0 },
    unit: { type: String, required: true },
    rate: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("ExtraItem", extraItemSchema);
