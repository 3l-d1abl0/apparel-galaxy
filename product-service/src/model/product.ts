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

export async function getProductById<T> (projection: T, id: string): Promise<ITrimmedProduct | IProduct>  {

  try{
      if (projection !== null){
        return TrimmedProduct.findOne(
          { uniqueId: id },
            projection
        );

      }else{
        console.log("Product:", Product);
        return Product.findOne({ uniqueId: id });  
      }

  }catch(error){
    console.log('ERR: getProductById<T> ', id, projection == null ? 'NULL': 'projectionTrimmed')
    console.log('ERR: ', error);
     return null;
  }

}