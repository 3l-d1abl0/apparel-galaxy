import mongoose from 'mongoose';
import { config } from '../config/config.js';
import { WithId, Filter } from 'mongodb';

import { IProduct , ITrimmedProduct, projectionProductTrimmed} from './productModel.js';
import { Product, TrimmedProduct  } from './productModel.js';


export async function getAllProducts<T> (projection: T, skip: number, limit: number): Promise<ITrimmedProduct[] | IProduct[]>  {

  try{

    console.log(`NOTRIM Skip: ${skip}, Limit: ${limit} ${typeof projection}`);
    if (projection !== null){
      return TrimmedProduct.find({}, projection).skip(skip).limit(limit);
    }else{
      return Product.find().skip(skip).limit(limit);
    }

  }catch(error){

    console.log('ERR: getAllProducts<T> ', skip, limit, projection == null ? 'NULL': 'projectionTrimmed')
    console.log('ERR: ', error);
    return null;

  }
}