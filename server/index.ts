import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", express.static(path.join(__dirname, "public")));
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" } // Adjust this as needed
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

io.on("connection", (socket) => {
  const mac = socket.handshake.auth?.macAddress;
  console.log("Connection attempt with auth:", socket.handshake.auth);
  if (!mac) {
    console.log("Disconnecting socket due to missing macAddress");
    socket.disconnect(true);
    return;
  }
  socket.join(mac);
  console.log(`Client connected with MAC: ${mac}, SID: ${socket.id}`);
  socket.on("disconnect", () => console.log(`Client disconnected: ${mac}, SID: ${socket.id}`));
});

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

(async () => {
  const server = await registerRoutes(app, io);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
    const port = 5000;
    httpServer.listen(
        {
          port: 5000,
          host: "localhost",
          reusePort: true,
        },
        () => {
          log(`serving on port ${port}`);
        }
    );
})();
