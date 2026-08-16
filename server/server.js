import express from "express";
import cors from 'cors';
import "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import employeesRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import mongoose from 'mongoose'
import chatRouter from "./routes/chatRoutes.js";

const app = express()
const PORT = process.env.PORT  ||  4000;

// Startup configuration checks to surface missing environment variables
const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_EMAIL',
];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn('Warning: Missing required environment variables:', missing.join(', '));
}

// Leave CORS open by default to preserve the existing public-API behaviour.
// For production, set CORS_ORIGINS to a comma-separated list of frontend URLs
// (for example: https://my-app.vercel.app). Requests without an Origin header,
// such as Vercel health checks, are always allowed.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json())
app.use(multer().none())


//Routes
app.get('/',(req,res) => res.send('server is running'))
app.get('/health', (req, res) => {
  const dbState = (mongoose.connection.readyState === 1) ? 'connected' : 'disconnected';
  res.json({status: 'ok', db: dbState});
})
app.use('/api/auth',authRouter)
app.use('/api/employees',employeesRouter)
app.use('/api/profile',profileRouter)
app.use('/api/attendance',attendanceRouter)
app.use('/api/leave',leaveRouter)
app.use('/api/payslips',payslipRouter)
app.use('/api/dashboard',dashboardRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/chat', chatRouter);

await connectDB()

// Vercel imports the Express application as a serverless function.  Starting
// a listener there prevents Vercel from handling requests correctly; retain
// the listener only for local development.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`server running on port ${PORT}`));
}


export default app;
