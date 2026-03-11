import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

const globalState = globalThis.__MONGO_CONN__ || {
  conn: null,
  promise: null
};

globalThis.__MONGO_CONN__ = globalState;

export async function connectDb() {
  if (!mongoUri) {
    return null;
  }

  if (globalState.conn) {
    return globalState.conn;
  }

  if (!globalState.promise) {
    globalState.promise = mongoose.connect(mongoUri).then((mongooseInstance) => mongooseInstance);
  }

  globalState.conn = await globalState.promise;
  return globalState.conn;
}
