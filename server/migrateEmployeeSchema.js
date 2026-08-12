import "dotenv/config";
import mongoose from "mongoose";
import Employee from "./models/Employee.js";

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Copy the legacy field names used by early versions of this project.
    const result = await Employee.collection.updateMany(
      { userID: { $exists: true }, userId: { $exists: false } },
      [
        {
          $set: {
            userId: "$userID",
            joinDate: { $ifNull: ["$joinDate", "$joindate"] },
          },
        },
      ]
    );

    const indexes = await Employee.collection.indexes();
    if (indexes.some((index) => index.name === "userID_1")) {
      await Employee.collection.dropIndex("userID_1");
      console.log("Removed legacy userID_1 index");
    }

    await Employee.syncIndexes();
    console.log(`Employee schema migration complete. Updated ${result.modifiedCount} record(s).`);
  } finally {
    await mongoose.disconnect();
  }
};

migrate().catch((error) => {
  console.error("Employee schema migration failed:", error.message);
  process.exitCode = 1;
});
