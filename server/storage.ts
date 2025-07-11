import {
  UserModel,
  TVModel,
  ContentModel,
  BroadcastModel,
  NotificationModel,
  BroadcastingActivityModel,
  ActivityModel,
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
import { generateVerificationToken, verifyToken } from './utils/token.js';
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";

function isJwtPayload(payload: any): payload is JwtPayload & { purpose?: string; userId?: string } {
  return typeof payload === "object" && payload !== null;
}

export class MongoStorage {
  constructor() {
    this.initializeDatabase();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const verificationToken = generateVerificationToken(insertUser.email);
    const user = await UserModel.create({
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role as "editor" | "manager" | "admin",
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    try {
      await emailTransporter.sendMail(getVerificationEmailTemplate(user, verificationToken));
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
    return this.transformUser(user);
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const payload = verifyToken(token);
      if (!isJwtPayload(payload) || payload.purpose !== 'email-verification') {
        return false;
      }
      const user = await UserModel.findOne({ email: payload.userId });
      if (!user) return false;
      if (user.emailVerified) return true;
      if (
          user.emailVerificationToken === token &&
          user.emailVerificationTokenExpires &&
          user.emailVerificationTokenExpires > new Date()
      ) {
        user.emailVerified = true;
        user.status = 'active';
        user.emailVerificationToken = '';
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in verifyEmail:', error);
      return false;
    }
  }

  async generateEmailVerification(email: string): Promise<{ token: string } | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const token = generateVerificationToken(email);
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.updateUser(user.id, user);
    return { token };
  }

  async sendVerificationEmail(user: User, verificationToken: string): Promise<boolean> {
    try {
      const emailTemplate = getVerificationEmailTemplate(user, verificationToken);
      await emailTransporter.sendMail(emailTemplate);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await UserModel.findOne({ email });
    if (!user) return;
    const token = generateVerificationToken(email);
    user.passwordResetToken = token;
    user.passwordResetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    await emailTransporter.sendMail({
      from: `"TV Content Manager" <${process.env.SMTP_USER || 'onlyleesin147@gmail.com'}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.firstName} ${user.lastName},</p>
          <p>We received a request to reset your password. Please click the button under to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Regards,<br>TV Content Manager Team</p>
        </div>
      `
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const payload = verifyToken(token);
      if (!isJwtPayload(payload)) {
        return false;
      }
      const user = await UserModel.findOne({
        email: payload.userId,
        passwordResetToken: token,
        passwordResetTokenExpires: { $gt: new Date() }
      });
      if (!user) return false;
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordResetToken = "";
      user.passwordResetTokenExpires = null as any;
      await user.save();
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      return false;
    }
  }

  private async initializeDatabase() {
    await connectToDatabase();
    await this.seedData();
  }

  private async seedData() {
    // ...seed logic if needed...
  }

  async getUser(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.transformUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    return user ? this.transformUser(user) : null;
  }

  async updateUser(id: string | undefined, user: Partial<InsertUser>): Promise<User | null> {
    if (!id) return null;
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    } else {
      delete user.password;
    }
    const updated = await UserModel.findByIdAndUpdate(
        id,
        { $set: user },
        { new: true }
    );
    if (!updated) return null;
    return this.transformUser(updated);
  }

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
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    });
    return tvs.map(tv => this.transformTV(tv));
  }

  async getTVsByStatus(status: string): Promise<TV[]> {
    const tvs = await TVModel.find({ status });
    return tvs.map(tv => this.transformTV(tv));
  }

  async getContent(id: string): Promise<Content | null> {
    const content = await ContentModel.findById(id);
    return content ? this.transformContent(content) : null;
  }

  async getAllContent(): Promise<Content[]> {
    const content = await ContentModel.find();
    return content.map(item => this.transformContent(item));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const selectedTvs = (insertContent.selectedTvs || []).map(tvId =>
        new mongoose.Types.ObjectId(tvId)
    );
    const content = await ContentModel.create({
      ...insertContent,
      selectedTvs
    });
    return this.transformContent(content);
  }

  async updateContent(id: string, updateData: Partial<InsertContent>): Promise<Content | null> {
    let update = { ...updateData };
    if (updateData.selectedTvs) {
      update.selectedTvs = updateData.selectedTvs.map(tvId =>
          new mongoose.Types.ObjectId(tvId)
      );
    }
    const content = await ContentModel.findByIdAndUpdate(id, update, { new: true });
    return content ? this.transformContent(content) : null;
  }

  async deleteContent(id: string): Promise<boolean> {
    const result = await ContentModel.findByIdAndDelete(id);
    return !!result;
  }

  async searchContent(query: string): Promise<Content[]> {
    const content = await ContentModel.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    });
    return content.map(item => this.transformContent(item));
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    const content = await ContentModel.find({ status });
    return content.map(item => this.transformContent(item));
  }

  async getBroadcast(id: string): Promise<Broadcast | null> {
    const broadcast = await BroadcastModel.findById(id);
    return broadcast ? this.transformBroadcast(broadcast) : null;
  }

  async getAllBroadcasts(): Promise<Broadcast[]> {
    const broadcasts = await BroadcastModel.find();
    return broadcasts.map(broadcast => this.transformBroadcast(broadcast));
  }

  async createBroadcast(contentId: string[], tvIds: string[]): Promise<void> {
    try {
      const broadcasts = tvIds.flatMap((tvId) =>
          contentId.map((cid) => ({
            contentId: cid,
            tvId,
            status: 'active',
            startedAt: new Date(),
          }))
      );
      await BroadcastModel.create(broadcasts);
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
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

  async getBroadcastingActivity(timeRange: string): Promise<BroadcastingActivity[]> {
    let days = 7;
    switch (timeRange) {
      case "24h": days = 1; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      case "365d": days = 365; break;
      default: days = 7;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];
    const activities = await BroadcastingActivityModel.find({
      date: { $gte: startDateString }
    });
    return activities.map(activity => ({
      id: activity._id.toString(),
      date: activity.date,
      broadcasts: activity.broadcasts,
      content: activity.content,
      errors: activity.errors,
      createdAt: activity.createdAt
    }));
  }

  async updateBroadcastingActivity(date: string, data: Partial<BroadcastingActivity>): Promise<void> {
    const existingActivity = await BroadcastingActivityModel.findOne({ date });
    if (existingActivity) {
      await BroadcastingActivityModel.updateOne({ date }, { $inc: data });
    } else {
      await BroadcastingActivityModel.create({ date, ...data });
    }
  }

  async getStats(): Promise<{
    totalTvs: number;
    activeContent: number;
    broadcasting: number;
    users: number;
  }> {
    const [totalTvs, activeContent, broadcasting, users] = await Promise.all([
      TVModel.countDocuments(),
      ContentModel.countDocuments({ status: "active" }),
      BroadcastModel.countDocuments({ status: "active" }),
      UserModel.countDocuments()
    ]);
    return { totalTvs, activeContent, broadcasting, users };
  }

  async getRecentActivity(timeRange: string = '7d'): Promise<{ id: string; type: string; message: string; time: string; createdAt: string }[]> {
    let days = 7;
    switch (timeRange) {
      case "24h": days = 1; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      default: days = 7;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const activities = await ActivityModel.find({
      createdAt: { $gte: startDate }
    })
        .sort({ createdAt: -1 })
        .limit(10);
    return activities.map(activity => ({
      id: activity._id.toString(),
      type: activity.type,
      message: activity.message,
      time: activity.time,
      createdAt: activity.createdAt.toISOString(),
    }));
  }

  private transformUser(user: any): User {
    return {
      emailVerificationToken: user.emailVerificationToken || "",
      emailVerificationTokenExpires: user.emailVerificationTokenExpires || new Date(),
      emailVerified: !!user.emailVerified,
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
      selectedTvs: (content.selectedTvs || []).map((id: any) => id.toString()),
      createdAt: content.createdAt,
      createdById: content.createdById.toString(),
      videoUrl: content.videoUrl,
      duration: content.duration,
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