import { config } from '../../../src/config/config.js';
import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the User document
export interface IUser extends Document {
  email: string;
  hashed_password: string;
  user_type: number;
  created_at: Date;
}

// Define the User schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  user_type: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
},{ collection: config.mongodb.user_collection });

// Create and export the User model
export const UserModel = mongoose.model<IUser>('User', UserSchema);
