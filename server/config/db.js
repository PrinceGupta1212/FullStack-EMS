import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    // A Vercel function can receive concurrent requests during cold start.
    // Reuse one connection attempt instead of opening a connection per request.
    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
            .then((mongooseInstance) => {
                console.log("Database connected");
                return mongooseInstance.connection;
            })
            .catch((error) => {
                connectionPromise = undefined;
                console.error("Database connection failed:", error.message);
                throw error;
            });
    }

    return connectionPromise;
};

export default connectDB;
