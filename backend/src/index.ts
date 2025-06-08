import app from "./app";
import { envConfig } from "./config/env.config";
import { connectDatabase } from "./config/database.config";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start the server
    const server = app.listen(envConfig.PORT, () => {
      console.log(`
🚀 Server is running!
🔉 Listening on port ${envConfig.PORT}
📝 Environment: ${envConfig.NODE_ENV}
🌐 URL: http://localhost:${envConfig.PORT}
      `);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});
