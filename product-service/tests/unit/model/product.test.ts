import mongoose from "mongoose";
import { MongoClient, Db, ObjectId } from "mongodb";
import { config } from "../../../src/config/config.js";
import { getProductById, getAllProducts, searchProducts } from "../../../src/model/product.js";
import { sampleProduct } from "../../data.js";
import { lookForQuery, validateProductSchema, validateTrimmedProductSchema } from "../../helper.js";
import { IProduct, productSchema, ITrimmedProduct, trimmedProductSchema, projectionProductTrimmed } from "../../../src/model/productModel.js";
import { exit } from "process";

var client: MongoClient;
let dBase: Db;
beforeAll(async () => {
  //Connection mongo client for inseting/deleting sample data
  client = await MongoClient.connect(config.mongodb.uri);
  dBase = client.db("");

  //Make Mongoose Connection
  mongoose
    .connect(config.mongodb.uri, {
      maxPoolSize: 4,
      minPoolSize: 2,
    })
    .then(() => {
      console.log("Mongoose connection Successful !");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      exit(0);
    });
});

afterAll(async () => {
  //close mongoClient connection
  await client.close();

  //Close mongoose connection
  await mongoose.disconnect();
});

describe("Fetch Product by Id", () => {
  beforeAll(async () => {
    //Setup new Sample Data with all fields
    const insert = await dBase
      .collection(config.mongodb.inventory_collection)
      .insertOne(sampleProduct);
  });

  afterAll(async () => {
    //delete the setup data
    const delOne = await dBase
      .collection(config.mongodb.inventory_collection)
      .deleteMany({ uniqueId: sampleProduct.uniqueId });
  });

  it("should return sample product with all fields", async () => {
    const product: ITrimmedProduct | IProduct = await getProductById<null>(
      null,
      sampleProduct.uniqueId,
    );
    expect(product.uniqueId).toBe(sampleProduct.uniqueId);
    //Validate the Schema
    validateProductSchema([product]);

  });

});
