import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI as string
    );

    console.log("✅ MongoDB Connected");
    console.log("📦 DB:", conn.connection.name);
  } catch (error) {
    console.error("❌ MongoDB Error:", error);

    process.exit(1);
  }
};
