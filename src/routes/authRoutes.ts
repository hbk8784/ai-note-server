import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - Register a new user
router.post("/register", (req, res) => {
  authController.register(req, res);
});

// POST /api/auth/login - Login user
router.post("/login", (req, res) => {
  authController.login(req, res);
});

// GET /api/auth/verify-email - Verify email address
router.get("/verify-email", (req, res) => {
  authController.verifyEmail(req, res);
});

// POST /api/auth/forgot-password - Request password reset
router.post("/forgot-password", (req, res) => {
  authController.forgotPassword(req, res);
});

// POST /api/auth/reset-password - Reset password
router.post("/reset-password", (req, res) => {
  authController.resetPassword(req, res);
});

// GET /api/auth/profile - Get user profile (protected)
router.get("/profile", authenticateToken, (req, res) => {
  authController.getProfile(req, res);
});

export default router;
