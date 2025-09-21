import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import User, { IUser } from "../models/User.js";
import { EmailService } from "./EmailService.js";

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
  };
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }

    return jwt.sign({ userId }, secret, { expiresIn: expiresIn as any });
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async register(
    userData: RegisterData
  ): Promise<{ message: string; user: IUser }> {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
    });

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();
    user.emailVerificationToken = verificationToken;

    await user.save();

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Don't throw error, user can still be created
    }

    return {
      message:
        "User created successfully. Please check your email to verify your account.",
      user,
    };
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = this.generateToken((user._id as any).toString());

    return {
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    return {
      message: "Email verified successfully! Welcome to AI Notes!",
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User with this email does not exist");
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }

    return {
      message: "Password reset email sent. Please check your inbox.",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return {
      message:
        "Password reset successfully. You can now login with your new password.",
    };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  async updateUser(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }
}
