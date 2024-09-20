import { IProduct , productSchema, ITrimmedProduct, trimmedProductSchema, projectionProductTrimmed} from '../src/model/productModel.js';
import { Product, TrimmedProduct  } from '../src/model/productModel.js';
//import { CartModel } from '../src/model/cart/cartModel.js';

export function lookForQuery(query:string , products:ITrimmedProduct[] | IProduct[]) {

    /*  Check for the Terms in:
      1. title
      2. description
      3. brand_name
      4. department_name
      5. variants.vColor_name
    */

    //Loop through each of the Products in result

    let queryPresent: boolean = true;

    products.forEach((product)=>{


      let variantsHas: boolean = false;
      const regex = new RegExp(query, 'i');
      
      //Check in variants
      if (product.hasOwnProperty('variants')) {
        variantsHas = product['variants'].reduce((acc, variant) => {
            acc ||= regex.test(variant['vColor_name']);
            return acc;
        }, false);
      }

      //Check in other fields
      const presentInProduct = variantsHas
        || regex.test(product.title)
        || regex.test(product.description)
        || regex.test(product.brand_name)
        || regex.test(product.department_name);

      console.log(variantsHas, product.title.includes(query), product.description.includes(query)
        , product.brand_name.includes(query)
        , product.department_name.includes(query)
        , product.department_name.includes(query));

      queryPresent = queryPresent && presentInProduct;

    });//forEach products


    return queryPresent;
}

export function validateProductSchema(products){
    //Validate the Schema
    products.forEach(prod => {
        const product = new Product(prod);
        expect(product.validateSync()).toBe(undefined);            
    });
}
  
  
export function validateTrimmedProductSchema(trimmedProduct){
    //Validate Trimmed Schema
    trimmedProduct.forEach(trimmedProd => {
      const trimmedProduct = new TrimmedProduct(trimmedProd);
      expect(trimmedProduct.validateSync()).toBe(undefined);
    });
}
