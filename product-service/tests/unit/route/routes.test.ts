import request from'supertest';
import { app } from '../../../src/app.js';
import { sampleProduct } from '../../data.js';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { config } from '../../../src/config/config.js';
import { getNormalToken, getAdminToken } from '../../../src/lib/tokens.js';
import mongoose from 'mongoose';
import { lookForQuery, validateProductSchema, validateTrimmedProductSchema } from '../../helper.js';
import { Product, TrimmedProduct  } from '../../../src/model/productModel.js';
import { exit } from 'process';

let client: MongoClient;
let userToken: string;
let adminToken: string;

beforeAll(async () => {

    //Make Mongoose Connection
    mongoose.connect(config.mongodb.uri, {
        maxPoolSize: 4,
        minPoolSize:2
    }).then(() => {
        console.log("Mongoose connection Successful !");
    }).catch((err) => {
        console.error('MongoDB connection error:', err)
        exit(0);
    });

    /*  SetUp before making calls to route  */
   userToken = getNormalToken();
   adminToken = getAdminToken();
   expect(userToken)

   //Insert Sample product in DB
   console.log('URI: ', config.mongodb.uri);
   console.log('URI: ', config.mongodb.inventory_collection);
  client = await MongoClient.connect(config.mongodb.uri);
  const dBase: Db = client.db();
  const insert = await dBase.collection(config.mongodb.inventory_collection).insertOne(sampleProduct);

});
  
afterAll(async () => {
  
    /*  TearDown after making calls to route  */
    const dBase: Db = client.db();
    //Remove the Sample Product from DB
    const delOne = await dBase.collection(config.mongodb.inventory_collection).deleteMany({uniqueId: sampleProduct.uniqueId});
    await client.close();
    
    await mongoose.disconnect();
    console.log('CLOSED');

});


describe("GET /products/:id", ()=>{
    
    
    it('should fetch sample Product - admin user',  async () => {
      
        const response = await request(app)
            .get(`/products/${sampleProduct.uniqueId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.uniqueId).toEqual(sampleProduct.uniqueId);

        //Validate the Schema
        validateProductSchema([response.body]);
    });
    
    
    it('should fetch sample Product - normal user (Trimmed)',  async () => {
      
        const response = await request(app)
            .get(`/products/${sampleProduct.uniqueId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.uniqueId).toEqual(sampleProduct.uniqueId);

        //matchTrimmedProduct(response.body);
        //Validate Trimmed Schema
        validateTrimmedProductSchema([response.body]);
    });

    
    it('should return 404',  async () => {

        //UniqueId is always a number
        const nonExistantUniqueID ='969696969696969';
        const response = await request(app)
        .get(`/products/${nonExistantUniqueID}`)
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(404);
        console.log(response.body);
        expect(response.body.message).toEqual('Product not found');

    });
    
    


    
    
});

describe("GET /products/", ()=>{

    it('should fetch all Product in default limit - admin user',  async () => {
      
        const response = await request(app)
        .get(`/products/`)
        .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.length).toEqual(5);

        //Validate the Schema
        validateProductSchema(response.body);

    });

    it('should fetch all Product in specific limit - normal User (Trimmed)',  async () => {
      
        const limit: number =20;
        const response = await request(app)
        .get(`/products?limit=${limit}`)
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.length).toEqual(limit);

        //Validate Trimmed Schema
        validateTrimmedProductSchema(response.body);
        

    });

    it('should fetch no product',  async () => {
        
        const dBase: Db = client.db();
        const documentCount:number = await dBase.collection(config.mongodb.inventory_collection).countDocuments();
        const limit: number = 33;
        const pages: number = Math.floor(documentCount/limit);

        //Fetching products beyound the total number of Products
        const response = await request(app)
        .get(`/products?page=${pages+10}&limit=${limit}`)
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.length).toEqual(0);
    });

});

describe("GET /products/search?q=", ()=>{

    it('should search the sample Product - admin User',  async () => {

        const query: string = sampleProduct.title.split(" ")[0];
        const limit: number = 10;
      
        const response = await request(app)
        .get(`/products/search?q=${query}&limit=${limit}`)
        .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toEqual(200);

        //#Products <= default - limit
        expect(response.body.length).toBeLessThanOrEqual(limit);
        
        //Check if the query is present the recieved result
        expect(lookForQuery(query, response.body)).toBe(true);

        //Validate the Schema
        validateProductSchema(response.body);

    });

    it('should search the sample Product - normal User (Trimmed)',  async () => {

        const query: string = sampleProduct.title.split(" ")[0];
        const limit: number = 10;
      
        const response = await request(app)
        .get(`/products/search?q=${query}&limit=${limit}`)
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(200);

        //#Products <= default - limit
        expect(response.body.length).toBeLessThanOrEqual(limit);
        
        //Check if the query is present the recieved result
        expect(lookForQuery(query, response.body)).toBe(true);

        //Validate the Schema
        validateTrimmedProductSchema(response.body);

    });

    
    it('Should not match any Product',  async () => {

        const query: string = "L'Amour Toujours";
        const limit: number = 10;
      
        const response = await request(app)
        .get(`/products/search?q=${query}&limit=${limit}`)
        .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.length).toBeLessThanOrEqual(0);
        

    });
})

