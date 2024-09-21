import { config } from '../../../src/config/config.js';
import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  vSku: string;
  vQuantity: number;
  vPrice: number;
}

export interface ICart extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vSku: {type: String, required: true },
  vQuantity: { type: Number, required: true },
  vPrice: { type: Number, required: true }
},{ _id: false });

const CartSchema = new Schema<ICart>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  items: [CartItemSchema],
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: config.mongodb.cart_collection });


export const CartModel = mongoose.model<ICart>('Cart', CartSchema);
