import { Request, Response, Router } from 'express';
import * as cartModel from '../model/cart/cart.js';
import {fetchProductByIdAndSku } from '../model/product/product.js';
import mongoose from 'mongoose';
import { ICart } from '../model/cart/cartModel.js';
import axios, { Axios, AxiosResponse } from 'axios'; 
import { config } from '../config/config.js';

const router = Router();


router.post('/checkout', async (req: Request, res: Response)=>{

  try{

    const userEmail: String = req.user.user

    const userCart = await cartModel.getCartByEmail(userEmail);
    console.log('cart/', userCart);

    if(!userCart){
        console.error(`Error while fetching cart for user: ${userEmail}`);
        return res.status(500).json({ message: "Error while checking out" });
    }
    
    //Empty cart
    if(Object.entries(userCart.cart).length === 0)
        return res.status(400).json({ message: "No Products to checkout (Empty Cart) !" });

    let cart: ICart = userCart.cart as ICart;

    const productsToReserve = {
      items: cart.items,
    };

    //1. Reserve the Products from the Cart
    let reservedCart: AxiosResponse; 
    let token: string = req.headers["authorization"].replace("Bearer ", "");

    try{

      reservedCart = await axios.post(
        `${config.PRODUCT_SERVICE}/reserve`, 
        productsToReserve,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  

    }catch(axiosError: any){
      console.log(axiosError);
      console.log(`Error calling ${config.PRODUCT_SERVICE}/reserve`, axiosError.response.status, axiosError.response.statusText);
      if( Object.hasOwn(axiosError.response, 'data') ){
          console.log(`Error: ${axiosError.response.data.message}`);
          return res.status(500).json({ message: `Error reserving Cart (${axiosError.response.data.message})` });
      }

      return res.status(500).json({ message: "Error reserving Cart" });
    }
    

    console.log("RESERVED: ",reservedCart.data);

    //2. Proceed to Create Order
    const orderData = {
      carId: cart._id,
      userId: cart.userId,
      items: cart.items,
      totalAmount: cart.totalAmount
    };

    let orderResponse: AxiosResponse;

    try{

      console.log("Creating Order ... ");
      orderResponse = await axios.post(
        `${config.ORDER_SERVICE}/order`, 
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

    }catch(axiosError: any){
      console.log(axiosError);
      console.log(`Error calling ${config.ORDER_SERVICE}`, axiosError.response.status, axiosError.response.statusText);
      //Unreserve the Products, either do a call or add it to some Queue to be processed by Workers
      try{
          reservedCart = await axios.post(
            `${config.PRODUCT_SERVICE}/unreserve`, 
            productsToReserve,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

      }catch(axiosError: any){
          console.log(`Error calling ${config.PRODUCT_SERVICE}/unreserve`, axiosError.response.status, axiosError.response.statusText);
          //Definitely put in a Queue with retry to unreserve
          return res.status(500).json({ message: "Error Unreserving Cart" });
      }

      return res.status(500).json({ message: "Error Creating Order !" });
    }
    
    //3. SET Cart status to Processing

    const cartId: mongoose.Types.ObjectId = cart._id as mongoose.Types.ObjectId;
    const updatedCartStatus = await cartModel.setCartToProcessing(cartId);

    if(updatedCartStatus == false){
      console.log('Failed to update cart to Processing !');
    }


    res.json(orderResponse.data);


  }catch (error) {
    console.log("ERROR /checkout",error);
    res.status(500).json({ message: "Error while checking out !" });
  }

});

router.get('/', async (req: Request, res: Response) => {
  try {

    const userEmail: String = req.user.user

    const userCart = await cartModel.getCartByEmail(userEmail);
    console.log('cart/', userCart);

    if(!userCart)
        return res.status(500).json({ message: "Error while fetching cart" });
    
    //Empty cart
    if(Object.entries(userCart.cart).length === 0)
        return res.json({message: 'Cart Empty !'});

    res.json(userCart.cart);

  } catch (error) {

    console.log(error);
    res.status(500).json({ message: "Error while fetching cart" });
  }
});


async function validateProductBeforeCart(productData){

  try{

    console.log(productData, mongoose.Types.ObjectId.isValid(productData.productId));

      if (!mongoose.Types.ObjectId.isValid(productData.productId))
        return { valid: false,
                  message: 'Invalid Product id' };

      if(!(typeof productData.vSku === 'string') )
        return { valid: false,
                message: 'variant sku should be string' };
            
      if(!(typeof productData.vQuantity === 'number') )
        return { valid: false,
                message: 'Product Quantity should be a Number' };
      
      console.log(productData.vQuantity, "000")
      if(productData.vQuantity <= 0)
        return { valid: false,
          message: 'Product Quantity should be a Positive Number' };


      if(!(typeof productData.vPrice === 'number') )
        return { valid: false,
                message: 'Product Price should be a Number' };


      const product = await fetchProductByIdAndSku(productData.productId, productData.vSku);

      if(!product)
        return { valid: false,
                  message: 'No Product Found' };
      
      if(product.variants[0].vQuantity < productData.vQuantity)
            return { valid: false,
              message: 'Product Quantity exceeded the Stock' };

      return { valid: true,
               message: product };

  }catch(error){
    console.log('Error while validating product (validateProductBeforeCart)');
    throw error;
  }
  
}

//Add Items to Cart
router.post('/', async (req: Request, res: Response) => {

    try {
      //const { productId, vSku, vQuantity, vPrice } = req.body;
      const productToAdd = {
        productId: req.body.productId,
        vSku: req.body.vSku,
        vQuantity: parseInt(req.body.vQuantity),
        vPrice: 0,
      };
      
      //Try to validate the Product to Add
      let productValidity;
      try{
        productValidity = await validateProductBeforeCart(productToAdd);

        if(productValidity.valid==false)
          return res.status(400).json({message: productValidity.message});

        console.log('Product Found(validated): ',productValidity);

        //Fetch the current Price of Product
        productToAdd.vPrice = productValidity.message.variants[0].vQuantity;


      }catch(error){
        console.log(error.message);
        return res.status(500).json({message: "Error encountered while validating Product"});
      }

      //Product(to add) valid so far, proceed to add to cart
      const userEmail: String = req.user.user
      let userCart = await cartModel.getCartByEmail(userEmail);
      console.log('cart DATA', userCart);

      if(!userCart)
        return res.status(500).json({ message: "Error while fetching cart" });
  
      //Empty Cart
      if (Object.entries(userCart.cart).length === 0) {

        const totalAmount: Number = productToAdd.vQuantity * productToAdd.vPrice;
        const user_id: mongoose.Types.ObjectId = userCart.user._id as mongoose.Types.ObjectId;

        console.log(userCart.user._id, productToAdd, totalAmount);

        let cart: ICart = await cartModel.addToEmptyCart(user_id, productToAdd, totalAmount);

        if(!cart)
          return res.status(500).json({ message: "Error while adding to cart" });

        return res.status(200).json(cart);

      }else {

        //Get the current cart data
        let cart: ICart = userCart.cart as ICart;

        const existingItemIndex = cart.items.findIndex(item => item.vSku === productToAdd.vSku);

        if (existingItemIndex > -1) {

          //One more check - cartQuantity + more to add <= totalQuantity of Product
          console.log("CHECK: ", cart.items[existingItemIndex].vQuantity, "+", productToAdd.vQuantity , productValidity.message.variants[0].vQuantity);
          if(cart.items[existingItemIndex].vQuantity + productToAdd.vQuantity > productValidity.message.variants[0].vQuantity)
            return res.status(400).json({message: "Reqested Quantity exceeds Stock"});

          let newCart = await cartModel.updateItemInCart(existingItemIndex, productToAdd, cart as ICart);
          if(!newCart)
            return res.status(500).json({ message: "Error while fetching cart" });

          return res.status(200).json(newCart);

        } else {

          let newCart = await cartModel.addItemInCart(productToAdd, cart as ICart);
          if(!newCart)
            return res.status(500).json({ message: "Error while fetching cart" });

          return res.status(200).json(newCart);
          
        }
        
      }

    } catch (error) {
      console.log("POST /cart: add Items to Cart", error);
      res.status(500).json({ message: error.message });
    }

});
  
router.delete('/', async (req: Request, res: Response) => {
  try {

    const userEmail: String = req.user.user;

    if (Object.keys(req.body).length === 0) {
      //Delete entire Cart
      let deletedCart = await cartModel.deleteEntireCart(userEmail);

      if(!deletedCart)
        return res.status(400).json({message: "Cart already Empty!"});
      

      return res.status(200).json({message: "Cart deleted succesfully !"});

    }else{
      //Delete only Requested Items
      let productToDelete = {
        productId: req.body.productId,
        vSku: req.body.vSku,
        vQuantity: parseInt(req.body.vQuantity),
        vPrice: 0,
      };

      if(productToDelete.vQuantity <=0)
        return res.status(400).json({ message: "Cannot delete requested items" });

      const userCart = await cartModel.getCartByEmail(userEmail);
      console.log('cart/', userCart);

      if(!userCart)
        return res.status(500).json({ message: "Error while Deleting items from cart" });
    
      //Empty cart
      if(Object.entries(userCart.cart).length === 0)
          return res.status(400).json({message: 'Cart already Empty !'});

      let cart: ICart = userCart.cart as ICart;

      const existingItemIndex = cart.items.findIndex(item => item.vSku === productToDelete.vSku);

      console.log("existingItemIndex: ", existingItemIndex);
      if(existingItemIndex <= -1)
        return res.status(400).json({message: 'Requested item does not exist in Cart'});

      //Single item in cart, and quentity is same as Ordered, delete entire cart
      if(cart.items.length == 1 && productToDelete.vQuantity === cart.items[existingItemIndex].vQuantity){
        
        let deletedCart = await cartModel.deleteEntireCart(userEmail);

        if(!deletedCart)
          return res.status(400).json({message: "Cart already Empty!"});
        
  
        return res.status(200).json({message: "Cart deleted succesfully !"});

      }



      console.log("Cart Item: ", cart.items);
      if(productToDelete.vQuantity > cart.items[existingItemIndex].vQuantity)
        return res.status(400).json({message: 'Requested item(s) cannot be delete from Cart (Less items persist in the Cart)'});

      //Get Price of the Product to add
      productToDelete["vPrice"] = cart.items[existingItemIndex].vPrice;

      const newCart = await cartModel.deleteItemInCart(existingItemIndex, productToDelete, cart)
      if(!newCart)
        return res.status(500).json({ message: "Error while deleting items from cart" });

      return res.status(200).json(newCart);
      
    }

  } catch (error) {
    console.log("DELETE /cart: delete Entire Cart", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;