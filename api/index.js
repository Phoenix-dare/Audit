import app from "../server/src/app.js";
import { connectDb } from "../server/src/db.js";

export default async function handler(req, res) {
  try {
    await connectDb();
  } catch (error) {
    console.warn("MongoDB connection warning:", error.message);
  }

  return app(req, res);
}
