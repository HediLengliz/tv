import express, { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertUserSchema, insertTvSchema, insertContentSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

import path from "path";

import mongoose from 'mongoose';
import { upload } from './utils/fileupload';

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

export async function registerRoutes(app: Express): Promise<Server> {
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
      handleError(res, error);
    }
  });


  app.post("/api/resend-verification-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token and update user
      const result = await storage.generateEmailVerification(email);
      if (!result) {
        return res.status(500).json({ message: "Failed to generate verification token" });
      }

      // Send the verification email
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
 //verifcation route
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

      // Populate creator info
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
          errors: [{ path: ["createdById"], message: "Creator ID is required" }]
        });
      }

      const processedTvData = {
        ...tvData,
        createdById: tvData.createdById // Pass as string
      };

      const tv = await storage.createTV(processedTvData);
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

      res.json(tv);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.get("/api/tvs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const tv = await storage.getTV(id);

      if (!tv) {
        return res.status(404).json({ message: "TV not found" });
      }

      // Get creator info
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
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTV(id);

      if (!deleted) {
        return res.status(404).json({ message: "TV not found" });
      }

      res.json({ message: "TV deleted successfully" });
    } catch (error) {
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

      // Populate creator info
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

      // Update broadcasting activity for content creation
      const today = new Date().toISOString().split('T')[0];
      await storage.updateBroadcastingActivity(today, { content: 1 });

      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
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

      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteContent(id);

      if (!deleted) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Broadcasting routes
  app.post("/api/broadcast", async (req, res) => {
    try {
      const { contentId, tvIds } = req.body;

      const broadcasts = [];
      for (const tvId of tvIds) {
        const broadcast = await storage.createBroadcast({
          contentId,
          tvId,
          status: "active"
        });
        broadcasts.push(broadcast);

        // Update TV status to broadcasting
        await storage.updateTV(tvId, { status: "broadcasting" });
      }

      res.status(201).json({ broadcasts, message: "Broadcasting started successfully" });
    } catch (error) {
      console.error('Broadcasting error:', error);

      // Update broadcasting activity for errors
      const today = new Date().toISOString().split('T')[0];
      await storage.updateBroadcastingActivity(today, { errors: 1 });

      res.status(500).json({ message: "Internal server error" });
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
      const recentActivity = [
        { id: 1, message: "TV-001 started broadcasting", time: "2 minutes ago", type: "success" },
        { id: 2, message: "New content uploaded", time: "5 minutes ago", type: "info" },
        { id: 3, message: "TV-003 disconnected", time: "10 minutes ago", type: "warning" },
        { id: 4, message: "User John created new TV", time: "1 hour ago", type: "info" },
      ];
      res.json(recentActivity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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

  const httpServer = createServer(app);
  return httpServer;
}
