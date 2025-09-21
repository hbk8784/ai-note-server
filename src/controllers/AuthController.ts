import { Request, Response } from "express";
import {
  AuthService,
  RegisterData,
  LoginData,
} from "../services/AuthService.js";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password }: RegisterData = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({
          error: "Name, email, and password are required",
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: "Password must be at least 8 characters long",
        });
        return;
      }

      const result = await this.authService.register({ name, email, password });

      res.status(201).json({
        message: result.message,
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          isEmailVerified: result.user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Error in register:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginData = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: "Email and password are required",
        });
        return;
      }

      const result = await this.authService.login({ email, password });

      if (!result.user.isEmailVerified) {
        res.status(400).json({
          error:
            "Email Verification Pending!.. Please check you inbox to verify",
        });
        return;
      }

      res.status(200).json({
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(401).json({
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res.status(400).json({
          error: "Verification token is required",
        });
        return;
      }

      const result = await this.authService.verifyEmail(token);

      res.status(200).json({
        message: result.message,
      });
    } catch (error) {
      console.error("Error in verifyEmail:", error);
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Email verification failed",
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          error: "Email is required",
        });
        return;
      }

      const result = await this.authService.forgotPassword(email);

      res.status(200).json({
        message: result.message,
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Password reset request failed",
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          error: "Token and password are required",
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: "Password must be at least 8 characters long",
        });
        return;
      }

      const result = await this.authService.resetPassword(token, password);

      res.status(200).json({
        message: result.message,
      });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Password reset failed",
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          error: "User not authenticated",
        });
        return;
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Error in getProfile:", error);
      res.status(500).json({
        error: "Failed to fetch user profile",
      });
    }
  }
}
