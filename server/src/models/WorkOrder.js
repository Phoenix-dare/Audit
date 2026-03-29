import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema(
  {
    agno: { type: String, required: true, unique: true },
    billDate: { type: Date },
    personCompany: { type: String, enum: ["Company", "Person"] },
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: "Contractor" },
    billRegisterNo: { type: String },
    nameOfWork: { type: String },
    workOrderNo: { type: String },
    agreementNo: { type: String },
    esasNo: { type: String },
    tsqsNo: { type: String },
    dateOfCompletion: { type: Date },
    actualDateOfCompletion: { type: Date },
    section: { type: String },
    cc: { type: String },
    measurementByAE: { type: Date },
    measurementByAEE: { type: Date },
    mbookNumbers: { type: String },
    pages: { type: String },
    estimateAmount: { type: Number, min: 0, default: 0 },
    partFinal: { type: String, enum: ["Final", "Part"] },
    fine: { type: String, enum: ["Yes", "No"] },
    ccpf: { type: String, enum: ["Final", "Part"], required: true },
    ccn: { type: String, enum: ["I", "II", "III", "IV"], required: true },
    coy: { type: String, enum: ["Company", "Person"], required: true },
    ued: { type: String, enum: ["Yes", "No"], default: "Yes" },
    pac: { type: Number, required: true, min: 0 },
    ba: { type: Number, required: true, min: 0 },
    baseValue: { type: Number, min: 0, default: 0 },
    baseAmount: { type: Number, required: true, min: 0 },
    billAmount: { type: Number, min: 0, default: 0 },
    gstToDeduct: { type: Number, min: 0, default: 0 },
    uptoDateBillAmount: { type: Number, min: 0, default: 0 },
    electricityCharges: { type: Number, min: 0, default: 0 },
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
