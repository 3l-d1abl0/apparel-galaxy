import { Request, Response, Router } from 'express';
//import { productModel } from '../model/product.js';
import * as productModel from '../model/product.js';
import { projectionProductTrimmed } from '../model/productModel.js';



/*
interface PaginationQuery {
  page?: string;
  limit?: string;
}
*/

const router = Router();


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

export default router;