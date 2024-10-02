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


export async function reserveProducts1(items: CartItem[]){

  const session = await mongoose.startSession();
  session.startTransaction();
  const lockedProductIds: mongoose.Types.ObjectId[] = [];

  try{

      try {
    
            // Lock and check availability for all items
            for (const item of items) {
              console.log("TRYING: ", item);
              const prod = await Product.findOneAndUpdate(
                {
                  _id: new mongoose.Types.ObjectId(item.productId),
                  'variants.vSku': item.vSku,
                  'variants.vQuantity': { $gte: item.vQuantity },
                  locked: false
                },
                { $set: { locked: true } },
                { new: true, session }
              );

              console.error("PROD: ", prod);
        
              if (!prod) {
                throw new Error(`Unable to lock or insufficient quantity for item: ${item.vSku}`);
              }
        
              lockedProductIds.push(prod._id);

            }//for

      }catch (error){
        console.error('ERR: reserveProduct : Checking Product ', error.message)
        console.error('ERR: ', error);
        await session.abortTransaction();
        // Ensure locks are released even if an error occurred
        if (lockedProductIds.length > 0) {
          await Product.updateMany(
            { _id: { $in: lockedProductIds } },
            { $set: { locked: false } },
            { session }
          );
        }
        session.endSession();
        if (error instanceof Error) {
          return { status : false, type : 1,  message: error.message};
        }else{
          return { status : false, type : 2,  message: "Internal Server Error !"};
        }

      }//Catch - if products are available

      try{

        // Reserve the items
        for (const item of items) {

          console.log("RESERVING: ", item);

          const result = await Product.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(item.productId),
              'variants.vSku': item.vSku,
              locked: true
            },
            {
              $inc: { 'variants.vQuantity': -item.vQuantity },
              $set: { locked: false }
            },
            { new: true, session }
          );
          
          console.log("RESULT: ", result);
          if (!result) {
            throw new Error(`Failed to reserve item: ${item.vSku}`);
          }
          
          await session.commitTransaction();
          session.endSession();
          return { status : true };
          
        }//for

      } catch (error) {


        await session.abortTransaction();
        console.error('ERR: reserveProduct ', error.message)
        console.error('Error during reservation:', error);
        // Ensure locks are released even if an error occurred
        if (lockedProductIds.length > 0) {
          await Product.updateMany(
            { _id: { $in: lockedProductIds } },
            { $set: { locked: false } },
            { session } 
          );
        }
        session.endSession();

        if (error instanceof Error) {
          return { status : false, type: 1, message: error.message };
        } else {
          return { status : false, type : 2,  message: "Internal Server Error !"};
        }
      }


  }catch(error){

    console.error('ERR: reserveProduct ', items)
    console.error('ERR: ', error);
    await session.abortTransaction();
    // Ensure locks are released even if an error occurred
    if (lockedProductIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: lockedProductIds } },
        { $set: { locked: false } },
        { session }
      );
    }
    session.endSession();

    return { status : false, type : 2,  message: "Internal Server Error !"};
  }
}



export async function reserveProducts(items: CartItem[]){

   // Start a MongoDB session for transactions
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Loop through items to reserve inventory
    for (const item of items) {
      const { productId, vSku, vQuantity } = item;

      // Find the product and check if the required quantity is available using an atomic update
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          'variants.vSku': vSku,
          'variants.vQuantity': { $gte: vQuantity }  // Ensure enough quantity is available
        },
        {
          $inc: { 'variants.$.vQuantity': -vQuantity }  // Atomically decrease the quantity
        },
        { new: true, session }  // Use the session in the operation
      );

      console.log("PRODUCT: ",product);

      if (!product) {
        // If the product or enough stock is not found, abort the transaction
        await session.abortTransaction();
        return { status : false, type: 1, message: `Insufficient quantity or product not found for SKU ${vSku}` };
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    return { status : true };
    

  } catch (error) {
    
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return { status : false, type: 2, message: 'Internal Server Error !' };

  }

}