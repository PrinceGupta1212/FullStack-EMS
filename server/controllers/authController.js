import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Login for employee and admin
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const {
            email,
            password,
            role_type
        } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        // User not found
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // Check requested role
        if (
            role_type === "admin" &&
            user.role !== "ADMIN"
        ) {
            return res.status(401).json({
                error: "Not authorized as admin"
            });
        }

        if (
            role_type === "employee" &&
            user.role !== "EMPLOYEE"
        ) {
            return res.status(401).json({
                error: "Not authorized as employee"
            });
        }

        // Check password
        const isValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValid) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // JWT payload
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        };

        // Create token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            user: payload,
            token
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Login failed"
        });
    }
};


// GET /api/auth/session
export const session = (req, res) => {
    const session = req.session;

    return res.json({
        user: session
    });
};


// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const session = req.session;

        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Both passwords are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(
            session.userId
        );

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const isValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValid) {
            return res.status(400).json({
                error: "Current password is incorrect"
            });
        }

        const hashed = await bcrypt.hash(
            newPassword,
            10
        );

        await User.findByIdAndUpdate(
            session.userId,
            {
                password: hashed
            }
        );

        return res.json({
            success: true
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            error: "Failed to change password"
        });
    }
};
