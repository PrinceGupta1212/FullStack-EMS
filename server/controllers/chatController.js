import { GoogleGenerativeAI } from '@google/generative-ai';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveApplication from '../models/LeaveApplication.js';
import Payslip from '../models/Payslip.js';
import { HR_FAQ_KNOWLEDGE } from '../constants/hrPolicies.js';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Build personalized context based on who's asking — this is the
// "data-aware" half. FAQ knowledge stays static and is always included.
const buildUserContext = async (session) => {
    if (session.role === "EMPLOYEE") {
        const employee = await Employee.findOne({ userId: session.userId }).lean();
        if (!employee) return "No employee profile found for this user.";

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [recentAttendance, pendingLeaves, allLeaves, latestPayslip] = await Promise.all([
            Attendance.find({ employeeId: employee._id, date: { $gte: startOfMonth } })
                .sort({ date: -1 }).lean(),
            LeaveApplication.find({ employeeId: employee._id, status: "PENDING" }).lean(),
            LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(5).lean(),
            Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
        ]);

        return `
CURRENT USER DATA (Employee):
Name: ${employee.firstName} ${employee.lastName}
Position: ${employee.position} | Department: ${employee.department}
Account status: ${employee.isDeleted ? "DEACTIVATED" : "ACTIVE"}

This month's attendance (${recentAttendance.length} records):
${JSON.stringify(recentAttendance.map(a => ({ date: a.date, status: a.status, workingHours: a.workingHours, dayType: a.dayType })))}

Pending leave requests: ${pendingLeaves.length}
Recent leave history: ${JSON.stringify(allLeaves.map(l => ({ type: l.type, startDate: l.startDate, endDate: l.endDate, status: l.status })))}

Latest payslip: ${latestPayslip ? JSON.stringify({
    month: latestPayslip.month, year: latestPayslip.year, netSalary: latestPayslip.netSalary
}) : "No payslip generated yet"}
        `;
    }

    if (session.role === "ADMIN") {
        const [totalEmployees, pendingLeaves, todayAttendance] = await Promise.all([
            Employee.countDocuments({ isDeleted: { $ne: true } }),
            LeaveApplication.countDocuments({ status: "PENDING" }),
            Attendance.countDocuments({
                date: { $gte: new Date(new Date().setHours(0,0,0,0)) }
            }),
        ]);

        return `
CURRENT USER DATA (Admin):
Total active employees: ${totalEmployees}
Pending leave approvals: ${pendingLeaves}
Employees checked in today: ${todayAttendance}
        `;
    }

    return "";
};

export const chatWithAssistant = async (req, res) => {
    try {
        const { message, history } = req.body;
        const session = req.session;

        if (!message) return res.status(400).json({ error: "Message is required" });

        const userContext = await buildUserContext(session);

        const systemPrompt = `You are the HR assistant for this Employee Management System.

You can answer two kinds of questions:
1. GENERAL policy/how-to questions — use the company policy knowledge below.
2. PERSONAL questions about the current user's own data (attendance, leaves, payslip) — use the user data below.

Rules:
- Never invent numbers or data that isn't provided below.
- If asked about someone else's data, politely say you can only help with the current user's own information.
- Keep answers short, clear, and friendly.
- If a question needs an Admin action (like approving leave), tell the user how to do it in the app rather than pretending to do it yourself.

${HR_FAQ_KNOWLEDGE}

${userContext}`;

        // Optional: pass recent conversation history for context continuity
        const conversationMessages = Array.isArray(history)
            ? history.slice(-6).map(h => ({ role: h.role, content: h.text }))
            : [];
// AB — ye use karo:
const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: systemPrompt 
});
const chat = model.startChat({
    history: conversationMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
    }))
});

const result = await chat.sendMessage(message);
const reply = result.response.text();

        return res.json({ reply });
    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({ error: "Chat assistant failed" });
    }
};