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
//Middleware

app.use(cors())
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


await connectDB()

// Vercel imports the Express application as a serverless function.  Starting
// a listener there prevents Vercel from handling requests correctly; retain
// the listener only for local development.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`server running on port ${PORT}`));
}


export default app;
