import express, { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertUserSchema, insertTvSchema, insertContentSchema, loginSchema } from "@shared/schema";
import {any, z} from "zod";
import path from "path";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose, {isValidObjectId} from 'mongoose';
import { upload } from './utils/fileupload';
import {ActivityModel, BroadcastModel, TVModel} from './database.js';

function handleError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Invalid input", errors: error.errors });
  }
  if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
  res.status(500).json({ message: "Internal server error" });
}
async function logActivity(io: SocketIOServer, type: string, message: string) {
  const activity = new ActivityModel({
    type,
    message,
    time: new Date().toISOString(),
    createdAt: new Date(),
  });
  await activity.save();
  io.emit("activity", [activity]);
}

const insertBroadcastSchema = z.object({
  contentId: z.string(),
  tvIds: z.array(z.string()),
  status: z.enum(["active", "paused", "stopped"]).default("active"),
  createdById: z.string(),
});

export async function registerRoutes(app: Express, io: SocketIOServer): Promise<HttpServer> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      await storage.updateLastLogin(user.id!);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid token" });
      }
      const verified = await storage.verifyEmail(token);
      if (!verified) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/resend-verification-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      const result = await storage.generateEmailVerification(email);
      if (!result) {
        return res.status(500).json({ message: "Failed to generate verification token" });
      }
      const success = await storage.sendVerificationEmail(user, result.token);
      if (!success) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, message: "User created successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      const success = await storage.verifyEmail(token);
      if (success) {
        return res.status(200).json({ message: "Email verified successfully" });
      } else {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to verify email'
      });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  // TV routes
  app.get("/api/tvs", async (req, res) => {
    try {
      const { search, status } = req.query;
      let tvs;
      if (search) {
        tvs = await storage.searchTVs(search as string);
      } else if (status) {
        tvs = await storage.getTVsByStatus(status as string);
      } else {
        tvs = await storage.getAllTVs();
      }
      const tvsWithCreators = await Promise.all(
          tvs.map(async (tv) => {
            const creator = await storage.getUser(tv.createdById);
            return {
              ...tv,
              createdBy: creator ? `${creator.firstName} ${creator.lastName}` : "Unknown"
            };
          })
      );
      res.json(tvsWithCreators);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/tvs", async (req, res) => {
    try {
      const tvData = insertTvSchema.parse(req.body);
      if (!tvData.createdById) {
        return res.status(400).json({
          message: "Invalid input",
          errors: [{ path: ["createdById"], message: "Creator ID is required" }],
        });
      }
      const processedTvData = {
        ...tvData,
        createdById: tvData.createdById,
      };
      const tv = await storage.createTV(processedTvData);
      await logActivity(io, "success", "TV created successfully");
      res.status(201).json(tv);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/tvs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const tvData = insertTvSchema.partial().parse(req.body);
      const tv = await storage.updateTV(id, tvData);
      if (!tv) {
        return res.status(404).json({ message: "TV not found" });
      }
      await logActivity(io, "success", "TV updated successfully");
      res.json(tv);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/tvs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const tv = await storage.getTV(id);
      if (!tv) {
        return res.status(404).json({ message: "TV not found" });
      }
      const creator = await storage.getUser(tv.createdById);
      const tvWithCreator = {
        ...tv,
        createdBy: creator ? `${creator.firstName} ${creator.lastName}` : "Unknown"
      };
      res.json(tvWithCreator);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/tvs/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid TV ID" });
    }
    try {
      const tv = await storage.deleteTV(id);
      if (!tv) {
        return res.status(404).json({ message: "TV not found" });
      }
      await logActivity(io, "deleted", "TV deleted successfully");
      res.status(200).json({ message: "TV deleted successfully" });
    } catch (error) {
      console.error("Error deleting TV:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Content routes
  app.get("/api/content", async (req, res) => {
    try {
      const { search, status } = req.query;
      let content;
      if (search) {
        content = await storage.searchContent(search as string);
      } else if (status) {
        content = await storage.getContentByStatus(status as string);
      } else {
        content = await storage.getAllContent();
      }
      const contentWithCreators = await Promise.all(
          content.map(async (item) => {
            const creator = await storage.getUser(item.createdById);
            return {
              ...item,
              createdBy: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'
            };
          })
      );
      res.json(contentWithCreators);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      const today = new Date().toISOString().split('T')[0];
      await storage.updateBroadcastingActivity(today, { content: 1 });
      await logActivity(io, "success", "Content created successfully");
      res.status(201).json(content);
    } catch (error) {
      handleError(res, error);
    }
  });
  app.get('/api/content/:id', async (req, res) => {
    try {
      const content = await storage.getContent(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found", id: req.params.id });
      }
      res.json(content);
    } catch (error) {
      console.error(`Error fetching content ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch content", id: req.params.id });
    }
  });

  app.put("/api/content/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const contentData = insertContentSchema.partial().parse(req.body);
      const content = await storage.updateContent(id, contentData);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      await logActivity(io, "success", "Content updated successfully");
      res.json(content);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteContent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Content not found" });
      }
      await logActivity(io, "success", "Content deleted successfully");
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Broadcasting routes
  app.post("/api/broadcast", async (req, res) => {
    try {
      const { contentId, tvIds } = req.body;
      if (!contentId || !tvIds || !Array.isArray(contentId) || !Array.isArray(tvIds)) {
        return res.status(400).json({ message: 'contentId and tvIds must be non-empty arrays' });
      }
      await storage.createBroadcast(contentId, tvIds);
      res.status(200).json({ message: 'Broadcast started successfully' });
    } catch (error) {
      console.error('Broadcasting error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/broadcast/stop", async (req, res) => {
    try {
      const { broadcastIds } = req.body;

      for (const id of broadcastIds) {
        await storage.updateBroadcast(id, {
          status: "stopped",
          stoppedAt: new Date()
        });
      }

      res.json({ message: "Broadcasting stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.post("/api/broadcast-by-mac", async (req, res) => {
    try {
      const { macAddress, content } = req.body;
      if (!macAddress || !content) {
        return res.status(400).json({ message: "macAddress and content are required" });
      }

      console.log(`Broadcasting to ${macAddress}:`, content);

      io?.to(macAddress).emit("broadcast", { content });

      res.json({ message: "Content sent to MAC successfully." });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/broadcasts/:tvId", async (req, res) => {
    try {
      const broadcasts = await BroadcastModel.find({ tvId: req.params.tvId });
      res.status(200).json(broadcasts); // Ensure this returns an array
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Broadcasting Activity route
  app.get("/api/analytics/broadcasting-activity", async (req, res) => {
    try {
      const timeRange = (req.query.timeRange as string) || '7d';
      const activityData = await storage.getBroadcastingActivity(timeRange);
      res.json(activityData);
    } catch (error) {
      console.error('Broadcasting activity error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recent activity route (simplified)
  app.get("/api/activity", async (req, res) => {
    try {
      const timeRange = (req.query.timeRange as string) || '7d';
      const recentActivity = await storage.getRecentActivity(timeRange);
      if (!Array.isArray(recentActivity)) {
        return res.status(500).json({ message: "Failed to load recent activity" });
      }
      if (io) {
        io.emit("activity", recentActivity);
      }
      if (recentActivity.length === 0) {
        return res.json([]);
      }
      res.json(recentActivity);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Image upload endpoint
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Serve files from /uploads
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Stop all broadcasts for a TV by tvId
  app.post("/api/broadcast/stop-by-tv", async (req, res) => {
    try {
      const { tvId } = req.body;
      if (!tvId) {
        return res.status(400).json({ message: "tvId is required" });
      }
      // Get all active broadcasts for this TV
      const broadcasts = await storage.getBroadcastsByTv(tvId);
      if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
        return res.json({ stopped: [] });
      }
      const stopped = [];
      for (const b of broadcasts) {
        const updated = await storage.updateBroadcast(b.id!, {
          status: "stopped",
          stoppedAt: new Date()
        });
        if (updated) stopped.push(updated);
      }
      res.json({ stopped });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Pause all broadcasts for a TV by tvId
  app.post("/api/broadcast/pause-by-tv", async (req, res) => {
    try {
      const { tvId } = req.body;
      if (!tvId) {
        return res.status(400).json({ message: "tvId is required" });
      }
      // Get all active broadcasts for this TV
      const broadcasts = await storage.getBroadcastsByTv(tvId);
      if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
        return res.json({ paused: [] });
      }
      const paused = [];
      for (const b of broadcasts) {
        if (b.status === "active") {
          // Use type assertion to bypass TS error if needed
          const updated = await storage.updateBroadcast(b.id!, {
            status: "paused" as any
          });
          if (updated) paused.push(updated);
        }
      }
      // Set TV status to maintenance
      await storage.updateTV(tvId, { status: "maintenance" });
      res.json({ paused });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resume all paused broadcasts for a TV by tvId
  app.post("/api/broadcast/resume-by-tv", async (req, res) => {
    try {
      const { tvId } = req.body;
      if (!tvId) {
        return res.status(400).json({ message: "tvId is required" });
      }
      // Get all paused broadcasts for this TV
      const broadcasts = await storage.getBroadcastsByTv(tvId);
      if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
        return res.json({ resumed: [] });
      }
      const resumed = [];
      for (const b of broadcasts) {
        if (b.status === "paused") {
          const updated = await storage.updateBroadcast(b.id!, {
            status: "active"
          });
          if (updated) resumed.push(updated);
        }
      }
      // Set TV status to broadcasting if any resumed, else keep as is
      if (resumed.length > 0) {
        await storage.updateTV(tvId, { status: "broadcasting" });
      }
      res.json({ resumed });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      await storage.sendPasswordResetEmail(email); // Pass the email
      res.json({ message: "If an account exists, a reset link has been sent." });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      const ok = await storage.resetPassword(token, password);
      if (!ok) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
