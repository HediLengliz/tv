import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("editor"), // editor, manager, admin
  status: text("status").notNull().default("pending"), // pending, active, inactive
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const tvs = pgTable("tvs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  macAddress: text("mac_address").notNull().unique(),
  status: text("status").notNull().default("offline"), // online, offline, broadcasting, maintenance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("draft"), // draft, active, scheduled, archived
  selectedTvs: json("selected_tvs").$type<number[]>().default([]), // Array of TV IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
});

export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => content.id).notNull(),
  tvId: integer("tv_id").references(() => tvs.id).notNull(),
  status: text("status").notNull().default("active"), // active, stopped, error
  startedAt: timestamp("started_at").defaultNow().notNull(),
  stoppedAt: timestamp("stopped_at"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertTvSchema = createInsertSchema(tvs).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({
  id: true,
  startedAt: true,
  stoppedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TV = typeof tvs.$inferSelect;
export type InsertTV = z.infer<typeof insertTvSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
