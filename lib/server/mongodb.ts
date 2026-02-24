import mongoose from "mongoose";
import "@/models/userModel";
import "@/models/interviewModel";
import "@/models/documentModel";
import "@/models/evaluationModel";

export { default as User } from "@/models/userModel";
export { default as InterviewModel } from "@/models/interviewModel";
export { default as DocumentModel } from "@/models/documentModel";
export { default as Evaluation } from "@/models/evaluationModel";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { dbName: "Nexus" })
      .then((mongoose) => {
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
