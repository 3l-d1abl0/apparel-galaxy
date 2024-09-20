import { config } from '../../config/config.js';
import mongoose, { Schema, Document } from 'mongoose';


export interface IVariant extends Document {
  variantId: string;
  vSku: string;
  vColor_id: number;
  vColor_name: string;
  vColor_colorGroup: string;
  vSize_id: number;
  vSize_name: string;
  vSale: boolean;
  vPrice: number;
  vAvailability: boolean;
  vQuantity: number;
}

// Interface for the Product
export interface IProduct extends Document {
  uniqueId: string;
  title: string;
  description: string;
  categoryPath: string[];
  categoryPathId: string[];
  imageUrl: string;
  productUrl: string;
  brand_id: number;
  brand_name: string;
  availability: boolean;
  style: string;
  sale: boolean;
  department_id: number;
  department_name: string;
  originalPriceRange: string;
  currentPriceRange: string;
  isPriceException: boolean;
  priceException: string;
  published: number;
  soldQty: number;
  variants: IVariant[];
}

// Schema for the Variant
export const variantSchema: Schema = new Schema({
  variantId: { type: String, required: true },
  vSku: { type: String, required: true },
  vColor_id: { type: Number, required: true },
  vColor_name: { type: String, required: false },
  vColor_colorGroup: { type: String, required: true },
  vSize_id: { type: Number, required: true },
  vSize_name: { type: String, required: true },
  vSale: { type: Boolean, default: false },
  vPrice: { type: Number, required: true },
  vAvailability: { type: Boolean, default: true },
  vQuantity: { type: Number, required: true},
});

// Schema for the Product
export const productSchema: Schema = new Schema({
  uniqueId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  categoryPath: { type: [String], required: true },
  categoryPathId: { type: [String], required: true },
  imageUrl: { type: String, required: true },
  productUrl: { type: String, required: true },
  brand_id: { type: Number, required: true },
  brand_name: { type: String, required: true },
  availability: { type: Boolean, default: true },
  style: { type: String, required: true },
  sale: { type: Boolean, default: false },
  department_id: { type: Number, required: true },
  department_name: { type: String, required: true },
  originalPriceRange: { type: String, required: true },
  currentPriceRange: { type: String, required: true },
  isPriceException: { type: Boolean, default: false },
  priceException: { type: String },
  published: { type: Number, required: true },
  soldQty: { type: Number, default: 0 },
  variants: { type: [variantSchema], default: [] },
}, { collection: config.mongodb.inventory_collection });



  //Projection for trimmed Product details
  export const projectionProductTrimmed = {
    _id: 1,
    uniqueId: 1,
    title: 1,
    description: 1,
    categoryPath: 1,
    imageUrl: 1,
    productUrl: 1,
    brand_name: 1,
    availability: 1,
    sale: 1,
    department_name: 1,
    currentPriceRange: 1,
    soldQty: 1,
    "variants.vSku": 1,
    "variants.vColor_name": 1,
    "variants.vColor_colorGroup":1,
    "variants.vSize_name": 1,
    "variants.vPrice": 1,
    "variants.vAvailability": 1,
    "variants.vQuantity": 1,
  };

  export interface TrimmedVariant {
    vSku: string;
    vColor_name: string;
    vColor_colorGroup: string;
    vSize_name: string;
    vPrice: number;
    vAvailability: boolean;
    vQuantity: number;
  }

// Schema for the trimmedVariant
export const trimmedVariantSchema: Schema = new Schema({
  _id: {type: mongoose.Schema.ObjectId},
  vSku: { type: String, required: true },
  vColor_name: { type: String, required: false },
  vColor_colorGroup: { type: String, required: true },
  vSize_name: { type: String, required: true },
  vPrice: { type: Number, required: true },
  vAvailability: { type: Boolean, default: true },
  vQuantity: { type: Number, required: true },
});
  
  export interface ITrimmedProduct {
    uniqueId: string;
    title: string;
    description: string;
    categoryPath: string[];
    imageUrl: string;
    productUrl: string;
    brand_name: string;
    availability: boolean;
    sale: boolean;
    department_name: string;
    currentPriceRange: string;
    soldQty: number;
    variants: TrimmedVariant[];
  }
  // Schema for the Product
export const trimmedProductSchema: Schema = new Schema({
  uniqueId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  categoryPath: { type: [String], required: true },
  imageUrl: { type: String, required: true },
  productUrl: { type: String, required: true },
  brand_name: { type: String, required: true },
  availability: { type: Boolean, default: true },
  sale: { type: Boolean, default: false },
  department_name: { type: String, required: true },
  currentPriceRange: { type: String, required: true },
  soldQty: { type: Number, default: 0 },
  variants: { type: [trimmedVariantSchema], default: [] },

}, { collection: config.mongodb.inventory_collection });

export const Product = mongoose.model<IProduct>('Product', productSchema);
export const TrimmedProduct = mongoose.model<ITrimmedProduct>('TrimmedProduct', trimmedProductSchema);