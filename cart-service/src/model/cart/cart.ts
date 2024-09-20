import { CartModel, ICart, ICartItem } from './cartModel.js';
import { UserModel, IUser } from '../user/userModel.js';
import mongoose from 'mongoose';



export async function getCartByEmail(userEmail: String):Promise<{ user: IUser; cart: {}; } | { user: IUser; cart: ICart; }> {

    try{

        const user: IUser = await UserModel.findOne({ email: userEmail });
        console.log('User: ',user);
        if(!user)
            throw new Error('USER_NOT_FOUND');;

        let cart:ICart = await CartModel.findOne({ userId: user._id });

        if(!cart) return {
            user: user,
            cart:{}
        };

        return {
            user: user,
            cart: cart
        }


    }catch(error){

        console.log('ERR: Model::getCartByEmail ')
        console.log('ERR: ', error);
        return null;

  }

}


export async function addToEmptyCart(user_id : mongoose.Types.ObjectId, itemtoAdd, totalAmount: Number){
    try{
        let cart = new CartModel({
            userId: user_id,
            items: [{ productId: itemtoAdd.productId,
                      vSku: itemtoAdd.vSku,
                      vQuantity: itemtoAdd.vQuantity,
                      vPrice: itemtoAdd.vPrice
                    }],
            totalAmount: totalAmount
          });
          console.log('Saving Cart ');
          return await cart.save();
    }catch(err){
        console.log('ERROR: addToEmptyCart ', err);
        return null;
    }
}


export async function updateItemInCart(existingItemIndex: number, productToAdd: ICartItem, cart: ICart){

    try{
        cart.items[existingItemIndex].vQuantity += productToAdd.vQuantity;
        //Update the new Cart Price
        cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.vQuantity * item.vPrice), 0);

        cart.updatedAt = new Date();
        return await cart.save();
    }catch(error){
        console.log('ERROR: updateItemsInCart ', error);
        return null;
    }

}

export async function addItemInCart(productToAdd: ICartItem, cart: ICart){
    try{

        console.log("productToAdd: ", productToAdd);
        cart.items.push({
            productId: productToAdd.productId,
            vSku: productToAdd.vSku,
            vQuantity: productToAdd.vQuantity,
            vPrice: productToAdd.vPrice
        });
        cart.totalAmount = productToAdd.vQuantity * productToAdd.vPrice;
        cart.updatedAt = new Date();
        return await cart.save();

    }catch(error){
        console.log('ERROR: addItemInCart ', error);
        return null;
    }

}

export async function deleteEntireCart(userEmail: String){
    try{
        const user: IUser = await UserModel.findOne({ email: userEmail });
        console.log('User Found: ',user);
        if(!user)
            throw new Error('USER_NOT_FOUND');;

        const deletedCart = await CartModel.findOneAndDelete({ userId: user._id });
    
        // Access the deleted document
        if (!deletedCart) {
          return null;
        } else {
          return deletedCart;
        }

    }catch(error){

        console.log('ERR: ModelCart::deleteEntireCart ')
        console.log('ERR: ', error);
        throw error;
  }
}

export async function deleteItemInCart(existingItemIndex: number, productToDelete: ICartItem, cart: ICart){
    try{

        if(cart.items[existingItemIndex].vQuantity === productToDelete.vQuantity){
            //remove the entire item
            //delete cart.items[existingItemIndex];
            cart.items.splice(existingItemIndex, 1);
        }else{
            cart.items[existingItemIndex].vQuantity -= productToDelete.vQuantity;
        }

        console.log("Updated Items: ", cart);
        //Update the new Cart Price
        cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.vQuantity * item.vPrice), 0);
        cart.updatedAt = new Date();
        return await cart.save();
    }catch(error){
        console.log('ERROR: deleteItemInCart ', error);
        return null;
    }
}