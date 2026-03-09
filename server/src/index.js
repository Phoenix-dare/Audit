import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;

// Start server immediately; MongoDB is optional for testing calculate endpoint
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Try connecting to MongoDB if URI is provided
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.warn("MongoDB connection warning:", error.message);
    });
} else {
  console.warn("MONGODB_URI not set - database endpoints unavailable");
}
