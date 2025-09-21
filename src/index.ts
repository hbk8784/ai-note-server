import express from "express";
import dotenv from "dotenv";
import { corsMiddleware } from "./middleware/cors.js";
import notesRoutes from "./routes/notesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import DatabaseConfig from "./config/database.js";

dotenv.config();

class Server {
  private app: express.Application;
  private port: number;
  private dbConfig: DatabaseConfig;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3001", 10);
    this.dbConfig = DatabaseConfig.getInstance();
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(corsMiddleware);

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: this.dbConfig.getConnectionStatus()
          ? "Connected"
          : "Disconnected",
      });
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/notes", notesRoutes);

    // 404 handler
    this.app.use(/.*/, (req, res) => {
      res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
      });
    });

    // Error handling middleware
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Unhandled error:", err);
        res.status(500).json({
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Something went wrong",
        });
      }
    );
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/health`);
      console.log(`🔐 Auth API: http://localhost:${this.port}/api/auth`);
      console.log(`📝 Notes API: http://localhost:${this.port}/api/notes`);
    });
  }

  public async stop(): Promise<void> {
    await this.dbConfig.disconnect();
  }
}

// Start the server
const server = new Server();
server.start();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await server.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  await server.stop();
  process.exit(0);
});
