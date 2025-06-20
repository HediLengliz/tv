import {
  UserModel,
  TVModel,
  ContentModel,
  BroadcastModel,
  NotificationModel,
  BroadcastingActivityModel,
  connectToDatabase
} from './database.js';
import {
  type User,
  type InsertUser,
  type TV,
  type InsertTV,
  type Content,
  type InsertContent,
  type Broadcast,
  type InsertBroadcast,
  type Notification,
  type InsertNotification,
  type BroadcastingActivity
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { emailTransporter, getVerificationEmailTemplate } from './email.js';
import { generateVerificationToken } from './utils/token.js';
import {number, undefined} from "zod";
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;

  updateUser(id: string | undefined, user: Partial<InsertUser>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  validateUser(email: string, password: string): Promise<User | null>;
  updateLastLogin(userId: string): Promise<void>;

  // TV methods
  getTV(id: string): Promise<TV | null>;
  getAllTVs(): Promise<TV[]>;
  createTV(tv: InsertTV): Promise<TV>;
  updateTV(id: string, tv: Partial<InsertTV>): Promise<TV | null>;
  deleteTV(id: string): Promise<boolean>;
  searchTVs(query: string): Promise<TV[]>;
  getTVsByStatus(status: string): Promise<TV[]>;

  // Content methods
  getContent(id: string): Promise<Content | null>;
  getAllContent(): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: string, content: Partial<InsertContent>): Promise<Content | null>;
  deleteContent(id: string): Promise<boolean>;
  searchContent(query: string): Promise<Content[]>;
  getContentByStatus(status: string): Promise<Content[]>;

  // Broadcast methods
  getBroadcast(id: string): Promise<Broadcast | null>;
  getAllBroadcasts(): Promise<Broadcast[]>;
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  updateBroadcast(id: string, broadcast: Partial<InsertBroadcast>): Promise<Broadcast | null>;
  deleteBroadcast(id: string): Promise<boolean>;
  getBroadcastsByTv(tvId: string): Promise<Broadcast[]>;
  getBroadcastsByContent(contentId: string): Promise<Broadcast[]>;

  // Broadcasting Activity methods
  getBroadcastingActivity(timeRange: string): Promise<BroadcastingActivity[]>;
  updateBroadcastingActivity(date: string, data: Partial<BroadcastingActivity>): Promise<void>;

  // Statistics
  getStats(): Promise<{
    totalTvs: number;
    activeContent: number;
    broadcasting: number;
    users: number;
  }>;
}

export class MongoStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const verificationToken = generateVerificationToken(insertUser.email);
    const user = await UserModel.create({
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role as "editor" | "manager" | "admin", // Explicitly cast role
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    try {
      await emailTransporter.sendMail(getVerificationEmailTemplate(user, verificationToken));
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return this.transformUser(user);
  }

// Add a method to verify email
  async verifyEmail(token: string): Promise<boolean> {
    try {
      console.log(`Processing verification token: ${token}`);

      const user = await UserModel.findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        console.error('Invalid or expired verification token');
        throw new Error('Invalid or expired verification token');
      }

      console.log(`Found user for verification: ${user.email}, current verified status: ${user.emailVerified}`);

      // Update user properties
      user.emailVerified = true;
      user.status = 'active';
      user.emailVerificationToken = '';

      // Save and wait for the save to complete
      const savedUser = await user.save();

      console.log(`User after save: ${savedUser.email}, verified: ${savedUser.emailVerified}, status: ${savedUser.status}`);

      return true;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      throw error;
    }
  }
  // async generateEmailVerification(email: string): Promise<{ token: string } | null> {
  //   const user = await this.getUserByEmail(email);
  //   if (!user) return null;
  //
  //   const token = Math.random().toString(36).substring(2); // Example token generation
  //   user.emailVerificationToken = token;
  //   user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  //   await this.updateUser(user.id); // Save the updated user
  //   return { token };
  // }
  async generateEmailVerification(email: string): Promise<{ token: string } | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = Math.random().toString(36).substring(2); // Example token generation
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.updateUser(user.id,user); // Save the updated user
    return { token };
  }

  async sendVerificationEmail(user: User, verificationToken: string): Promise<boolean> {
    try {
      const emailTemplate = getVerificationEmailTemplate(user, verificationToken);
      console.log("Attempting to send email to:", user.email);
      console.log("Using SMTP config:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER
      });

      const info = await emailTransporter.sendMail(emailTemplate);
      console.log("Email sent successfully:", info);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
  private async initializeDatabase() {
    await connectToDatabase();
    await this.seedData();
  }


  // User methods
  async getUser(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.transformUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    return user ? this.transformUser(user) : null;
  }

  // async createUser(insertUser: InsertUser): Promise<User> {
  //   const hashedPassword = await bcrypt.hash(insertUser.password, 10);
  //   const user = await UserModel.create({
  //     ...insertUser,
  //     password: hashedPassword,
  //   });
  //   return this.transformUser(user);
  // }

  async updateUser(id: string | undefined, user: Partial<InsertUser>): Promise<User | null> {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    const updatedUser = await UserModel.findByIdAndUpdate(id, user, { new: true }); // Renamed variable
    return updatedUser ? this.transformUser(updatedUser) : null;
  }
  private async seedData() {
    // Check if admin user exists
    const existingAdmin = await UserModel.findOne({ email: "admin@example.com" });
    if (existingAdmin) return;

    // First, delete the problematic record causing the duplicate key error
    try {
      await BroadcastingActivityModel.deleteOne({ date: "2025-06-19" });
      console.log("Removed problematic test data from 2025-06-19");
    } catch (error) {
      console.error("Error while removing test data:", error);
    }

    // Create sample broadcasting activity data
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Check if activity for this date already exists
      const existingActivity = await BroadcastingActivityModel.findOne({ date: dateString });
      if (!existingActivity) {
        try {
          await BroadcastingActivityModel.create({
            date: dateString,
            broadcasts: Math.floor(Math.random() * 20) + 5,
            content: Math.floor(Math.random() * 15) + 3,
            errors: Math.floor(Math.random() * 5),
          });
        } catch (error) {
          console.error(`Failed to create activity for date ${dateString}:`, error);
        }
      }
    }
  }
  // async updateUser(id: string | undefined, user: Partial<InsertUser>): Promise<User | null> {
  //   if (user.password) {
  //     user.password = await bcrypt.hash(user.password, 10);
  //   }
  //   const user = await UserModel.findByIdAndUpdate(id, user, { new: true });
  //   return user ? this.transformUser(user) : null;
  // }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(user => this.transformUser(user));
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? this.transformUser(user) : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  // TV methods
  async getTV(id: string): Promise<TV | null> {
    const tv = await TVModel.findById(id);
    return tv ? this.transformTV(tv) : null;
  }

  async getAllTVs(): Promise<TV[]> {
    const tvs = await TVModel.find();
    return tvs.map(tv => this.transformTV(tv));
  }

  async createTV(insertTV: InsertTV): Promise<TV> {
    const tv = await TVModel.create(insertTV);
    return this.transformTV(tv);
  }

  async updateTV(id: string, updateData: Partial<InsertTV>): Promise<TV | null> {
    const tv = await TVModel.findByIdAndUpdate(id, updateData, { new: true });
    return tv ? this.transformTV(tv) : null;
  }

  async deleteTV(id: string): Promise<boolean> {
    const result = await TVModel.findByIdAndDelete(id);
    return !!result;
  }

  async searchTVs(query: string): Promise<TV[]> {
    const tvs = await TVModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { macAddress: { $regex: query, $options: 'i' } }
      ]
    });
    return tvs.map(tv => this.transformTV(tv));
  }

  async getTVsByStatus(status: string): Promise<TV[]> {
    const tvs = await TVModel.find({ status });
    return tvs.map(tv => this.transformTV(tv));
  }

  // Content methods
  async getContent(id: string): Promise<Content | null> {
    const content = await ContentModel.findById(id);
    return content ? this.transformContent(content) : null;
  }

  async getAllContent(): Promise<Content[]> {
    const content = await ContentModel.find();
    return content.map(item => this.transformContent(item));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const content = await ContentModel.create(insertContent);
    return this.transformContent(content);
  }

  async updateContent(id: string, updateData: Partial<InsertContent>): Promise<Content | null> {
    const content = await ContentModel.findByIdAndUpdate(id, updateData, { new: true });
    return content ? this.transformContent(content) : null;
  }

  async deleteContent(id: string): Promise<boolean> {
    const result = await ContentModel.findByIdAndDelete(id);
    return !!result;
  }

  async searchContent(query: string): Promise<Content[]> {
    const content = await ContentModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    return content.map(item => this.transformContent(item));
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    const content = await ContentModel.find({ status });
    return content.map(item => this.transformContent(item));
  }

  // Broadcast methods
  async getBroadcast(id: string): Promise<Broadcast | null> {
    const broadcast = await BroadcastModel.findById(id);
    return broadcast ? this.transformBroadcast(broadcast) : null;
  }

  async getAllBroadcasts(): Promise<Broadcast[]> {
    const broadcasts = await BroadcastModel.find();
    return broadcasts.map(broadcast => this.transformBroadcast(broadcast));
  }

  async createBroadcast(insertBroadcast: InsertBroadcast): Promise<Broadcast> {
    const broadcast = await BroadcastModel.create(insertBroadcast);

    // Update broadcasting activity
    const today = new Date().toISOString().split('T')[0];
    await this.updateBroadcastingActivity(today, { broadcasts: 1 });

    return this.transformBroadcast(broadcast);
  }

  async updateBroadcast(id: string, updateData: Partial<InsertBroadcast>): Promise<Broadcast | null> {
    const broadcast = await BroadcastModel.findByIdAndUpdate(id, updateData, { new: true });
    return broadcast ? this.transformBroadcast(broadcast) : null;
  }

  async deleteBroadcast(id: string): Promise<boolean> {
    const result = await BroadcastModel.findByIdAndDelete(id);
    return !!result;
  }

  async getBroadcastsByTv(tvId: string): Promise<Broadcast[]> {
    const broadcasts = await BroadcastModel.find({ tvId });
    return broadcasts.map(broadcast => this.transformBroadcast(broadcast));
  }

  async getBroadcastsByContent(contentId: string): Promise<Broadcast[]> {
    const broadcasts = await BroadcastModel.find({ contentId });
    return broadcasts.map(broadcast => this.transformBroadcast(broadcast));
  }

  // Broadcasting Activity methods
  async getBroadcastingActivity(timeRange: string): Promise<BroadcastingActivity[]> {
    let days = 7;
    switch (timeRange) {
      case '24h':
        days = 1;
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    const activities = await BroadcastingActivityModel.find({
      date: { $gte: startDateString }
    }).sort({ date: 1 });

    return activities.map(activity => ({
      _id: activity._id?.toString(),
      date: activity.date,
      broadcasts: activity.broadcasts,
      content: activity.content,
      errors: activity.errors,
      createdAt: activity.createdAt,
    }));
  }

  async updateBroadcastingActivity(date: string, data: Partial<BroadcastingActivity>): Promise<void> {
    // Check if a record with this date already exists
    const existingActivity = await BroadcastingActivityModel.findOne({ date });

    if (existingActivity) {
      // If it exists, update the existing record
      await BroadcastingActivityModel.updateOne(
          { date },
          {
            $inc: {
              broadcasts: data.broadcasts || 0,
              content: data.content || 0,
              errors: data.errors || 0
            }
          }
      );
    } else {
      // If it doesn't exist, create a new record
      await BroadcastingActivityModel.create({
        date,
        broadcasts: data.broadcasts || 0,
        content: data.content || 0,
        errors: data.errors || 0
      });
    }
  }

  // Statistics
  async getStats(): Promise<{
    totalTvs: number;
    activeContent: number;
    broadcasting: number;
    users: number;
  }> {
    const [totalTvs, activeContent, broadcasting, users] = await Promise.all([
      TVModel.countDocuments(),
      ContentModel.countDocuments({ status: 'active' }),
      TVModel.countDocuments({ status: 'broadcasting' }),
      UserModel.countDocuments(),
    ]);

    return {
      totalTvs,
      activeContent,
      broadcasting,
      users,
    };
  }

  // Transform methods to ensure consistent data structure
  private transformUser(user: any): User {
    return {
      emailVerificationToken: "",
      emailVerified: user.emailVerified || false,
      emailVerificationTokenExpires: new Date(),
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  private transformTV(tv: any): TV {
    return {
      id: tv._id.toString(),
      name: tv.name,
      description: tv.description,
      macAddress: tv.macAddress,
      status: tv.status,
      createdAt: tv.createdAt,
      createdById: tv.createdById.toString(),
    };
  }

  private transformContent(content: any): Content {
    return {
      id: content._id.toString(),
      title: content.title,
      description: content.description,
      imageUrl: content.imageUrl,
      status: content.status,
      selectedTvs: content.selectedTvs.map((id: any) => id.toString()),
      createdAt: content.createdAt,
      createdById: content.createdById.toString(),
    };
  }

  private transformBroadcast(broadcast: any): Broadcast {
    return {
      id: broadcast._id.toString(),
      contentId: broadcast.contentId.toString(),
      tvId: broadcast.tvId.toString(),
      status: broadcast.status,
      startedAt: broadcast.startedAt,
      stoppedAt: broadcast.stoppedAt,
    };
  }
}

export const storage = new MongoStorage();
