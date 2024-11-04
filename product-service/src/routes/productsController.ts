import { Request, Response, Router } from 'express';
import * as productModel from '../model/product.js';
import { projectionProductTrimmed } from '../model/productModel.js';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Product, TrimmedProduct  } from '../model/productModel.js';
import { config } from '../config/config.js';
import{ createHmac, timingSafeEqual }  from 'crypto';
import signatureCheck  from '../middleware/signatureCheck.js';
/*
interface PaginationQuery {
  page?: string;
  limit?: string;
}
*/

const router = Router();

//Browser Products
router.get('/', async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
  
  try {

  
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    
    let products;

    console.log(req.user);
    if (req.user.role == 0)
      products = await productModel.getAllProducts<null>(null, skip, limit);
    else
      products = await productModel.getAllProducts<typeof projectionProductTrimmed>(projectionProductTrimmed, skip, limit);
      

    console.log('/all', products.length, page, limit, skip);
    if (products) {
      res.json(products);
    } else {
      res.status(404).json({ message: 'Products not found' });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get Product by uniqueId
router.get('/:id(\\d+)', async (req, res) => {
  try {

    const productId:string = req.params.id;

    let product;
    if (req.user.role == 0)
      product =  await productModel.getProductById<null>(null, productId);
    else
      product = await productModel.getProductById<typeof projectionProductTrimmed>(projectionProductTrimmed, productId);
    
    console.log('PRODUCT:', product);
    if (product) {
      return res.status(200).json(product);
    } else {
      return res.status(404).json({ message: 'Product not found' });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/search', async (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {

  try {

    let q:string  = req.query.q;
    console.log(q, req.query.page, req.query.limit);
    q= q.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    
    if (!q) {
      return res.status(400).json({ message: 'Provide a Search Query' });
    }

    console.log(`/search ${q} ${skip} ${limit}`);

    let products;

    if (req.user.role == 0)
      products = await productModel.searchProducts<null>(null, q, skip, limit);
    
    else
      products = await productModel.searchProducts<typeof projectionProductTrimmed>(projectionProductTrimmed, q, skip, limit);

    //const products = await productModel.searchProducts(q, skip, limit);

    if (products) {
      res.json(products);
    } else {
      res.status(404).json({ message: `Products not found for query ${q}` });
    }

  } catch (error) {
    console.error('Error in product search:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/reserve', [
  body('items').isArray(),
  body('items.*.productId').isString(),
  body('items.*.vSku').isString(),
  body('items.*.vQuantity').isInt({ min: 1 }),
  body('items.*.vPrice').isFloat({ min: 0 }),
  ],
  signatureCheck,
  async(req, res)=>{


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.headers);
    return res.status(400).json({ errors: "Intentional" });

    const items: CartItem[] = req.body.items;

    const reserveStatus =  await productModel.reserveProducts(items);

    if(reserveStatus.status == true){
      //Products reserved
      res.status(200).json({ message: 'Items reserved successfully' });
    }else{
      if(reserveStatus.type ==1)
        res.status(400).json({ message: reserveStatus.message });
      else{
        res.status(500).json({ mesage: reserveStatus.message });
      }
    }


});


// Checkout Route with Concurrency Handling
router.post('/checkout', async (req: Request, res: Response) => {
  const { items } = req.body;
  const session = await mongoose.startSession(); // Start a MongoDB session for transactions
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

      if (!product) {
        // If the product or enough stock is not found, abort the transaction
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient quantity or product not found for SKU ${vSku}` });
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Products reserved successfully' });

  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});



export default router;