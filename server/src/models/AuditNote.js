import mongoose from "mongoose";

const auditNoteSchema = new mongoose.Schema(
  {
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true },
    findingNo: { type: String },
    category: { 
      type: String, 
      enum: ["Observation", "Finding", "Exception", "Compliance", "Other"],
      default: "Observation"
    },
    description: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },
    recommendedAction: { type: String },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open"
    },
    auditedBy: { type: String },
    auditDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("AuditNote", auditNoteSchema);
