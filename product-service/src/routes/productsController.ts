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
  async(req: Request, res: Response)=>{


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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




router.post('/unreserve', [
  body('items').isArray(),
  body('items.*.productId').isString(),
  body('items.*.vSku').isString(),
  body('items.*.vQuantity').isInt({ min: 1 }),
  body('items.*.vPrice').isFloat({ min: 0 }),
  ],
  signatureCheck,
  async(req: Request, res: Response)=>{


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const items: CartItem[] = req.body.items;
    
    //Try to Unreserve the Product
    const unReserveStatus =  await productModel.unReserveProducts(items);

    if(unReserveStatus.status == true){
      //Products reserved
      res.status(200).json({ message: 'Items unreserved successfully' });
    }else{
      if(unReserveStatus.type ==1)
        res.status(400).json({ message: unReserveStatus.message });
      else{
        res.status(500).json({ mesage: unReserveStatus.message });
      }
    }


});



export default router;