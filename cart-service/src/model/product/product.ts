import mongoose from 'mongoose';
import { Product, IProduct } from './productModel.js';


export async function fetchProductByIdAndSku(productId: string, vSku: String):Promise<IProduct|null>{
  
    try {
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(productId),
        'variants.vSku': vSku,
      }, {
        'variants.$': 1,
      });
  
      return product;
    } catch (error) {
      console.error('Error fetchProductByIdAndSku:', error);
      throw error;
    }
  
  }