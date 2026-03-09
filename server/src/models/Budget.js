import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    headOfAccount: { type: String, required: true },
    allocation: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    expenditure: { type: Number, default: 0, min: 0 },
    fiscalYear: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
