import { z } from "zod";

// MongoDB Document interfaces
export interface User {
  emailVerificationToken: string;
  emailVerificationTokenExpires: Date;
  emailVerified: boolean; // <-- fix type
  _id?: string;
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "editor" | "manager" | "admin";
  status: "pending" | "active" | "inactive";
  phone?: string;
  createdAt: Date;
  lastLoginAt?: Date | null;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
}

export interface TV {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  macAddress: string;
  status: string;
  createdAt: Date;
  createdById: string;
}

export interface Content {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: string;
  selectedTvs: string[];
  createdAt: Date;
  createdById: string;
  videoUrl?: string; // <-- made optional
  duration?: number;
}

export interface Broadcast {
  _id?: string;
  id?: string;
  contentId: string;
  tvId: string;
  status: string;
  name: string;
  startedAt: Date;
  stoppedAt?: Date | null;
}

export interface Notification {
  _id?: string;
  id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface BroadcastingActivity {
  _id?: string;
  date: string;
  broadcasts: number;
  content: number;
  errors: number;
  stoppedAt?: Date | null;
  createdAt: Date;
}

// Insert schemas using Zod
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["editor", "manager", "admin"]).default("editor"),
  status: z.enum(["pending", "active", "inactive"]).default("pending"),
  phone: z.string().optional(),
});

export const insertTvSchema = z.object({
  name: z.string().min(1, "TV name is required"),
  description: z.string().optional(),
  macAddress: z.string().min(1, "MAC address is required"),
  status: z.enum(["online", "offline", "broadcasting", "maintenance"]).default("offline"),
  createdById: z.string().min(1, "Creator ID is required"),
});

export const insertContentSchema = z.object({
  title: z.string().min(1, "Content title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["draft", "active", "scheduled", "archived"]).default("draft"),
  selectedTvs: z.array(z.string()).default([]),
  createdById: z.string().min(1, "Creator ID is required"),
  duration: z.number().min(1, "Duration must be at least 1 second").default(15),
  videoUrl: z.string().optional(), // <-- add this line to make videoUrl optional in Zod schema
});

export const insertBroadcastSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  tvId: z.string().min(1, "TV ID is required"),
  status: z.enum(["active", "stopped", "error"]).default("active"),
  startedAt: z.date().optional(),
  stoppedAt: z.date().optional(),
});

export const insertNotificationSchema = z.object({
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  read: z.boolean().default(false),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTV = z.infer<typeof insertTvSchema>;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
