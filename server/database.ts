import {boolean, string} from "zod";
import mongoose, { Schema } from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tv-content-manager';

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },      // e.g. success, info, warning, error
  message: { type: String, required: true },   // Activity description
  time: { type: String, required: true },      // e.g. "just now", "2 minutes ago"
  createdAt: { type: Date, default: Date.now } // For sorting
});
// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['editor', 'manager', 'admin'], default: 'editor' },
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false }, // <-- fix type
  emailVerificationToken: { type: String },
  emailVerificationTokenExpires: { type: Date },
  passwordResetToken: { type: String , default:""},
  passwordResetTokenExpires: { type: Date , default:null},
});

// TV Schema
const tvSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  macAddress: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline', 'broadcasting', 'maintenance'], default: 'offline' },
  createdAt: { type: Date, default: Date.now },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Content Schema
const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  videoUrl: { type: String }, // <-- removed required: true
  status: { type: String, enum: ['draft', 'active', 'scheduled', 'archived'], default: 'draft' },
  selectedTvs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TV' }],
  createdAt: { type: Date, default: Date.now },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: Number, default: 15 }, // <-- add this line
});

// Broadcast Schema
const broadcastSchema = new mongoose.Schema({
  contentId: [{ type: Schema.Types.ObjectId, ref: 'Content', required: true }],
  tvId: { type: mongoose.Schema.Types.ObjectId, ref: 'TV', required: true },
  status: { type: String, enum: ['active', 'stopped', 'error', 'paused'], default: 'active' }, // <-- add 'paused'
  startedAt: { type: Date, default: Date.now },
  stoppedAt: { type: Date, default: null },
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Broadcasting Activity Schema
const broadcastingActivitySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  broadcasts: { type: Number, default: 0 },
  content: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Models
export const UserModel = mongoose.model('User', userSchema);
export const TVModel = mongoose.model('TV', tvSchema);
export const ContentModel = mongoose.model('Content', contentSchema);
export const BroadcastModel = mongoose.model('Broadcast', broadcastSchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);
export const BroadcastingActivityModel = mongoose.model('BroadcastingActivity', broadcastingActivitySchema);
export const ActivityModel = mongoose.model('Activity', activitySchema);