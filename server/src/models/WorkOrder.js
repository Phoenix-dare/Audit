import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    agno: { type: String, required: true, unique: true },
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: "Contractor" },
    ccpf: { type: String, enum: ["Final", "Part"], required: true },
    ccn: { type: String, enum: ["I", "II", "III", "IV"], required: true },
    coy: { type: String, enum: ["Company", "Person"], required: true },
    ued: { type: String, enum: ["Yes", "No"], default: "Yes" },
    pac: { type: Number, required: true, min: 0 },
    ba: { type: Number, required: true, min: 0 },
    baseAmount: { type: Number, required: true, min: 0 },
    eCharge: { type: Number, default: 0, min: 0 },
    agdate: { type: Date },
    wod: { type: Date },
    doc: { type: Date },
    adoc: { type: Date },
    budgetCode: { type: String },
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
    need: { type: Number, default: 0 },
    extraItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "ExtraItem" }],
    auditNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "AuditNote" }],
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Approved", "Paid", "Closed"],
      default: "Draft"
    },
    calculations: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("WorkOrder", workOrderSchema);
