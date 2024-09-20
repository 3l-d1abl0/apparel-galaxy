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


type ProjectionType = typeof projectionProductTrimmed | null;

interface MatchStage {
  $match: {
    $or: Array<{ [key: string]: { $in: RegExp[] } }>;
  };
}

interface ProjectStage {
  $project: typeof projectionProductTrimmed;
}

type PipelineStage = MatchStage | ProjectStage;



const regexPipeline = (query: string, projection: ProjectionType): PipelineStage[] =>{

      //Split if multiword 
      //const terms = query.split(' ').map(term => new RegExp(term, 'i'));
      const terms = new RegExp(query, 'i');
      //console.log(terms);

      const pipeline:PipelineStage[] = [
        {
          $match: {
            $or: [
              { title: { $in: [terms] } },
              { description: { $in: [terms] } },
              { brand_name: { $in: [terms] } },
              { department_name: { $in: [terms] } },
              { 'variants.vColor_name': { $in: [terms] } }
            ]
          }
        },
      ];

      if (projection !== null) {
        pipeline.push({
          $project: projection,
        });
      }
      
      return pipeline;
}
export async function searchProducts<T> (projection: T, query: string, skip: number, limit: number): Promise<ITrimmedProduct[] | IProduct[]>  {

  try{
    if (projection !== null){
      const pipeline = regexPipeline(query, projectionProductTrimmed);
      return TrimmedProduct.aggregate(pipeline).skip(skip).limit(limit);
    }else{
      const pipeline = regexPipeline(query, null);
      console.log('pipeline ', pipeline);
      return Product.aggregate(pipeline).skip(skip).limit(limit);
    }

  }catch(error){
    console.log('ERR: searchProducts<T> ', query, skip, limit, projection == null ? 'NULL': 'projectionTrimmed')
    console.log('ERR: ', error);
    return null;
  }
}