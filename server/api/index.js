import app from "../src/app.js";
import { connectDb } from "../src/db.js";

export default async function handler(req, res) {
  try {
    await connectDb();
  } catch (error) {
    console.warn("MongoDB connection warning:", error.message);
  }

  return app(req, res);
}
