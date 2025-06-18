import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTvSchema, insertContentSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateLastLogin(user.id);
      
      // In a real app, you'd create a JWT token here
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ user: userWithoutPassword, message: "User created successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
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
            createdBy: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'
          };
        })
      );

      res.json(tvsWithCreators);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tvs", async (req, res) => {
    try {
      const tvData = insertTvSchema.parse(req.body);
      const tv = await storage.createTV(tvData);
      res.status(201).json(tv);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/tvs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/tvs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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

  const httpServer = createServer(app);
  return httpServer;
}
