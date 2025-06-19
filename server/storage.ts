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

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | null>;
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

  private async initializeDatabase() {
    await connectToDatabase();
    await this.seedData();
  }

  private async seedData() {
    // Check if admin user exists
    const existingAdmin = await UserModel.findOne({ email: "admin@example.com" });
    if (existingAdmin) return;

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await UserModel.create({
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Admin",
      role: "admin",
      status: "active",
      phone: "+1 (555) 123-4567",
      lastLoginAt: new Date(),
    });

    // Create sample manager
    const managerPassword = await bcrypt.hash("manager123", 10);
    const managerUser = await UserModel.create({
      email: "sarah.manager@company.com",
      password: managerPassword,
      firstName: "Sarah",
      lastName: "Manager",
      role: "manager",
      status: "active",
      phone: "+1 (555) 234-5678",
      lastLoginAt: new Date(Date.now() - 86400000),
    });

    // Create sample editor
    const editorPassword = await bcrypt.hash("editor123", 10);
    const editorUser = await UserModel.create({
      email: "mike.editor@company.com",
      password: editorPassword,
      firstName: "Mike",
      lastName: "Editor",
      role: "editor",
      status: "pending",
      phone: "+1 (555) 345-6789",
    });

    // Create sample TVs
    const tv1 = await TVModel.create({
      name: "Conference Room TV",
      description: "Main conference room display",
      macAddress: "AA:BB:CC:DD:EE:FF",
      status: "online",
      createdById: adminUser._id,
    });

    const tv2 = await TVModel.create({
      name: "Lobby Display",
      description: "Reception area information display",
      macAddress: "11:22:33:44:55:66",
      status: "broadcasting",
      createdById: managerUser._id,
    });

    const tv3 = await TVModel.create({
      name: "Cafeteria Screen",
      description: "Menu and announcements display",
      macAddress: "77:88:99:AA:BB:CC",
      status: "offline",
      createdById: adminUser._id,
    });

    // Create sample content
    await ContentModel.create({
      title: "Holiday Sale Promotion",
      description: "Special holiday offers and seasonal promotions for customers",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      status: "active",
      selectedTvs: [tv1._id, tv2._id, tv3._id],
      createdById: managerUser._id,
    });

    await ContentModel.create({
      title: "Company Meeting Slides",
      description: "Quarterly review presentation for all employees",
      imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      status: "scheduled",
      selectedTvs: [tv1._id],
      createdById: adminUser._id,
    });

    await ContentModel.create({
      title: "Weekly Menu Display",
      description: "Cafeteria menu for the upcoming week with nutritional info",
      imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      status: "draft",
      selectedTvs: [],
      createdById: editorUser._id,
    });

    // Create sample broadcasting activity data
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      await BroadcastingActivityModel.create({
        date: dateString,
        broadcasts: Math.floor(Math.random() * 20) + 5,
        content: Math.floor(Math.random() * 15) + 3,
        errors: Math.floor(Math.random() * 5),
      });
    }
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = await UserModel.create({
      ...insertUser,
      password: hashedPassword,
    });
    return this.transformUser(user);
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | null> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const user = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    return user ? this.transformUser(user) : null;
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
    await BroadcastingActivityModel.findOneAndUpdate(
      { date },
      { 
        $inc: { 
          broadcasts: data.broadcasts || 0,
          content: data.content || 0,
          errors: data.errors || 0
        }
      },
      { upsert: true }
    );
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
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
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