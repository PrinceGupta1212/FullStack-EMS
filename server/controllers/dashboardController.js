import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";

// GET /api/dashboard
export const getDashboard = async (req, res) => {
    try {
        const session = req.session;

        // Check authentication
        if (!session || !session.userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        // =========================
        // ADMIN DASHBOARD
        // =========================
        if (session.role === "ADMIN") {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(startOfToday);
            endOfToday.setDate(endOfToday.getDate() + 1);

            const [
                totalEmployee,
                todayAttendance,
                pendingLeaves,
            ] = await Promise.all([
                Employee.countDocuments({
                    isDeleted: { $ne: true },
                }),

                Attendance.countDocuments({
                    date: {
                        $gte: startOfToday,
                        $lt: endOfToday,
                    },
                }),

                LeaveApplication.countDocuments({
                    status: "PENDING",
                }),
            ]);

            return res.json({
                role: "ADMIN",
                totalEmployees: totalEmployee,
                totalDepartments: DEPARTMENTS.length,
                todayAttendance,
                pendingLeaves,
            });
        }

        // =========================
        // EMPLOYEE DASHBOARD
        // =========================

        if (session.role !== "EMPLOYEE") {
            return res.status(403).json({
                error: "Invalid user role",
            });
        }
        // Find employee using logged-in User ID
        let employee = await Employee.findOne({
            userId: session.userId,
        }).lean();

        // Repair employee records created before the userId field was made
        // consistent. The authenticated token email is safe to use as a
        // fallback and lets existing accounts recover without re-creation.
        if (!employee && session.email) {
            employee = await Employee.findOne({
                email: session.email.trim().toLowerCase(),
            }).lean();

            if (employee) {
                await Employee.updateOne(
                    { _id: employee._id },
                    { $set: { userId: session.userId } }
                );
                employee.userId = session.userId;
            }
        }

        if (!employee) {
            return res.status(404).json({
                error: "Employee profile not found",
            });
        }

        // Current month dates
        const today = new Date();

        const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        const startOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            1
        );

        // Get dashboard data
        const [
            currentMonthAttendance,
            pendingLeaves,
            latestPayslip,
        ] = await Promise.all([
            // Attendance of current month
            Attendance.countDocuments({
                employeeId: employee._id,
                date: {
                    $gte: startOfMonth,
                    $lt: startOfNextMonth,
                },
            }),

            // Pending leaves
            LeaveApplication.countDocuments({
                employeeId: employee._id,
                status: "PENDING",
            }),

            // Latest payslip
            Payslip.findOne({
                employeeId: employee._id,
            })
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        // Return employee dashboard
        return res.json({
            role: "EMPLOYEE",

            employee: {
                ...employee,
                id: employee._id.toString(),
            },

            currentMonthAttendance,

            pendingLeaves,

            latestPayslip: latestPayslip
                ? {
                      ...latestPayslip,
                      id: latestPayslip._id.toString(),
                  }
                : null,
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        return res.status(500).json({
            error: "Failed to fetch dashboard",
            details: error.message,
        });
    }
};
