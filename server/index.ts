import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import multer from "multer";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", express.static(path.join(__dirname, "public")));
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});

// Multer for video uploads (.mp4 only)
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isMp4 = file.mimetype === 'video/mp4' && file.originalname.toLowerCase().endsWith('.mp4');
    if (isMp4) {
      cb(null, true);
    } else {
      cb(new Error('Only .mp4 video files are allowed!'));
    }
  }
});

// Multer for document uploads (PDF/Word only, preserves extension)
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});
const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const extAllowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) && extAllowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word (.doc, .docx) files are allowed!'));
    }
  }
});

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Video upload endpoint
app.post('/api/upload/video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'Video uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// Document upload endpoint
app.post('/api/upload/doc', docUpload.single('doc'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'Document uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// Logging middleware
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

// Socket.io connection
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

(async () => {
  const server = await registerRoutes(app, io);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  httpServer.listen(
      {
        port: 5000,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      }
  );
})();