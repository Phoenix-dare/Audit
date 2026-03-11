import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./db.js";

const port = process.env.PORT || 5000;

// Start server immediately; MongoDB is optional for testing calculate endpoint
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

if (!process.env.MONGODB_URI) {
  console.warn("MONGODB_URI not set - database endpoints unavailable");
} else {
  connectDb()
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.warn("MongoDB connection warning:", error.message);
    });
}
