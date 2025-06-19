import { users, tvs, content, broadcasts, notifications, type User, type InsertUser, type TV, type InsertTV, type Content, type InsertContent, type Broadcast, type InsertBroadcast, type Notification, type InsertNotification } from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  validateUser(email: string, password: string): Promise<User | null>;
  updateLastLogin(userId: number): Promise<void>;

  // TV methods
  getTV(id: number): Promise<TV | undefined>;
  getAllTVs(): Promise<TV[]>;
  createTV(tv: InsertTV): Promise<TV>;
  updateTV(id: number, tv: Partial<InsertTV>): Promise<TV | undefined>;
  deleteTV(id: number): Promise<boolean>;
  searchTVs(query: string): Promise<TV[]>;
  getTVsByStatus(status: string): Promise<TV[]>;

  // Content methods
  getContent(id: number): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;
  searchContent(query: string): Promise<Content[]>;
  getContentByStatus(status: string): Promise<Content[]>;

  // Broadcast methods
  getBroadcast(id: number): Promise<Broadcast | undefined>;
  getAllBroadcasts(): Promise<Broadcast[]>;
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  updateBroadcast(id: number, broadcast: Partial<InsertBroadcast>): Promise<Broadcast | undefined>;
  deleteBroadcast(id: number): Promise<boolean>;
  getBroadcastsByTv(tvId: number): Promise<Broadcast[]>;
  getBroadcastsByContent(contentId: number): Promise<Broadcast[]>;

  // Statistics
  getStats(): Promise<{
    totalTvs: number;
    activeContent: number;
    broadcasting: number;
    users: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private tvs: Map<number, TV> = new Map();
  private content: Map<number, Content> = new Map();
  private broadcasts: Map<number, Broadcast> = new Map();
  private currentUserId = 1;
  private currentTvId = 1;
  private currentContentId = 1;
  private currentBroadcastId = 1;

  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser: User = {
      id: this.currentUserId++,
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Admin",
      role: "admin",
      status: "active",
      phone: "+1 (555) 123-4567",
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample manager
    const managerPassword = await bcrypt.hash("manager123", 10);
    const managerUser: User = {
      id: this.currentUserId++,
      email: "sarah.manager@company.com",
      password: managerPassword,
      firstName: "Sarah",
      lastName: "Manager",
      role: "manager",
      status: "active",
      phone: "+1 (555) 234-5678",
      createdAt: new Date(Date.now() - 86400000),
      lastLoginAt: new Date(Date.now() - 86400000),
    };
    this.users.set(managerUser.id, managerUser);

    // Create sample editor
    const editorPassword = await bcrypt.hash("editor123", 10);
    const editorUser: User = {
      id: this.currentUserId++,
      email: "mike.editor@company.com",
      password: editorPassword,
      firstName: "Mike",
      lastName: "Editor",
      role: "editor",
      status: "pending",
      phone: "+1 (555) 345-6789",
      createdAt: new Date(Date.now() - 172800000),
      lastLoginAt: null,
    };
    this.users.set(editorUser.id, editorUser);

    // Create sample TVs
    const sampleTVs = [
      {
        id: this.currentTvId++,
        name: "Conference Room TV",
        description: "Main conference room display",
        macAddress: "AA:BB:CC:DD:EE:FF",
        status: "online",
        createdAt: new Date(Date.now() - 86400000),
        createdById: adminUser.id,
      },
      {
        id: this.currentTvId++,
        name: "Lobby Display",
        description: "Reception area information display",
        macAddress: "11:22:33:44:55:66",
        status: "broadcasting",
        createdAt: new Date(Date.now() - 172800000),
        createdById: managerUser.id,
      },
      {
        id: this.currentTvId++,
        name: "Cafeteria Screen",
        description: "Menu and announcements display",
        macAddress: "77:88:99:AA:BB:CC",
        status: "offline",
        createdAt: new Date(Date.now() - 259200000),
        createdById: adminUser.id,
      },
    ];

    sampleTVs.forEach(tv => this.tvs.set(tv.id, tv as TV));

    // Create sample content
    const sampleContent = [
      {
        id: this.currentContentId++,
        title: "Holiday Sale Promotion",
        description: "Special holiday offers and seasonal promotions for customers",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
        status: "active",
        selectedTvs: [1, 2, 3],
        createdAt: new Date(),
        createdById: managerUser.id,
      },
      {
        id: this.currentContentId++,
        title: "Company Meeting Slides",
        description: "Quarterly review presentation for all employees",
        imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
        status: "scheduled",
        selectedTvs: [1],
        createdAt: new Date(Date.now() - 86400000),
        createdById: adminUser.id,
      },
      {
        id: this.currentContentId++,
        title: "Weekly Menu Display",
        description: "Cafeteria menu for the upcoming week with nutritional info",
        imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
        status: "draft",
        selectedTvs: [],
        createdAt: new Date(Date.now() - 172800000),
        createdById: editorUser.id,
      },
    ];

    sampleContent.forEach(content => this.content.set(content.id, content as Content));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      password: hashedPassword,
      createdAt: new Date(),
      lastLoginAt: null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    if (updateData.password) {
      updatedUser.password = await bcrypt.hash(updateData.password, 10);
    }
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateLastLogin(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(userId, user);
    }
  }

  // TV methods
  async getTV(id: number): Promise<TV | undefined> {
    return this.tvs.get(id);
  }

  async getAllTVs(): Promise<TV[]> {
    return Array.from(this.tvs.values());
  }

  async createTV(insertTV: InsertTV): Promise<TV> {
    const tv: TV = {
      ...insertTV,
      id: this.currentTvId++,
      createdAt: new Date(),
    };
    this.tvs.set(tv.id, tv);
    return tv;
  }

  async updateTV(id: number, updateData: Partial<InsertTV>): Promise<TV | undefined> {
    const tv = this.tvs.get(id);
    if (!tv) return undefined;

    const updatedTV = { ...tv, ...updateData };
    this.tvs.set(id, updatedTV);
    return updatedTV;
  }

  async deleteTV(id: number): Promise<boolean> {
    return this.tvs.delete(id);
  }

  async searchTVs(query: string): Promise<TV[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tvs.values()).filter(tv =>
      tv.name.toLowerCase().includes(lowerQuery) ||
      tv.description?.toLowerCase().includes(lowerQuery) ||
      tv.macAddress.toLowerCase().includes(lowerQuery)
    );
  }

  async getTVsByStatus(status: string): Promise<TV[]> {
    return Array.from(this.tvs.values()).filter(tv => tv.status === status);
  }

  // Content methods
  async getContent(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const content: Content = {
      ...insertContent,
      id: this.currentContentId++,
      createdAt: new Date(),
    };
    this.content.set(content.id, content);
    return content;
  }

  async updateContent(id: number, updateData: Partial<InsertContent>): Promise<Content | undefined> {
    const content = this.content.get(id);
    if (!content) return undefined;

    const updatedContent = { ...content, ...updateData };
    this.content.set(id, updatedContent);
    return updatedContent;
  }

  async deleteContent(id: number): Promise<boolean> {
    return this.content.delete(id);
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(content =>
      content.title.toLowerCase().includes(lowerQuery) ||
      content.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getContentByStatus(status: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(content => content.status === status);
  }

  // Broadcast methods
  async getBroadcast(id: number): Promise<Broadcast | undefined> {
    return this.broadcasts.get(id);
  }

  async getAllBroadcasts(): Promise<Broadcast[]> {
    return Array.from(this.broadcasts.values());
  }

  async createBroadcast(insertBroadcast: InsertBroadcast): Promise<Broadcast> {
    const broadcast: Broadcast = {
      ...insertBroadcast,
      id: this.currentBroadcastId++,
      startedAt: new Date(),
      stoppedAt: null,
    };
    this.broadcasts.set(broadcast.id, broadcast);
    return broadcast;
  }

  async updateBroadcast(id: number, updateData: Partial<InsertBroadcast>): Promise<Broadcast | undefined> {
    const broadcast = this.broadcasts.get(id);
    if (!broadcast) return undefined;

    const updatedBroadcast = { ...broadcast, ...updateData };
    this.broadcasts.set(id, updatedBroadcast);
    return updatedBroadcast;
  }

  async deleteBroadcast(id: number): Promise<boolean> {
    return this.broadcasts.delete(id);
  }

  async getBroadcastsByTv(tvId: number): Promise<Broadcast[]> {
    return Array.from(this.broadcasts.values()).filter(broadcast => broadcast.tvId === tvId);
  }

  async getBroadcastsByContent(contentId: number): Promise<Broadcast[]> {
    return Array.from(this.broadcasts.values()).filter(broadcast => broadcast.contentId === contentId);
  }

  // Statistics
  async getStats(): Promise<{
    totalTvs: number;
    activeContent: number;
    broadcasting: number;
    users: number;
  }> {
    const totalTvs = this.tvs.size;
    const activeContent = Array.from(this.content.values()).filter(c => c.status === 'active').length;
    const broadcasting = Array.from(this.tvs.values()).filter(tv => tv.status === 'broadcasting').length;
    const users = this.users.size;

    return {
      totalTvs,
      activeContent,
      broadcasting,
      users,
    };
  }
}

export const storage = new MemStorage();