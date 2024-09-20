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

//Suite to Test Product by Id
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


  it("should return sample product (Trimmed)", async () => {
    const trimmedProduct: ITrimmedProduct = await getProductById<
      typeof projectionProductTrimmed
    >(projectionProductTrimmed, sampleProduct.uniqueId);

    expect(trimmedProduct.uniqueId).toEqual(sampleProduct.uniqueId);
    //Validate Trimmed Schema
    validateTrimmedProductSchema([trimmedProduct]);

  });

  it("should return no product", async () => {
    const nonExistantUniqueID = "CFDGH56489GHY";
    const product = await getProductById<null>(null, nonExistantUniqueID);

    expect(product).toBe(null);
  });

});


//Suite to Test Product by Search Query
describe("Search Product by query", () => {
  beforeAll(async () => {
    //Setup new Sample Data with all fields
    const insert = await dBase.collection("inventory").insertOne(sampleProduct);
  });

  afterAll(async () => {
    //delete the setup data
    const delOne = await dBase
      .collection("inventory")
      .deleteMany({ uniqueId: sampleProduct.uniqueId });
  });


  it("should search sample product and fetch all fields", async () => {
    const skip: number = 0;
    const limit: number = 10;
    const query: string = sampleProduct.title;

    const products: ITrimmedProduct[] | IProduct[] = await searchProducts<null>(
      null,
      query,
      skip,
      limit,
    );

    if (!products) expect(false);

    //#Products <= limit
    expect(products.length).toBeLessThanOrEqual(limit);

    //Check if the query is present the recieved result
    expect(lookForQuery(query, products)).toBe(true);

    validateProductSchema(products);
  });

  it("should search the sample product (Trimmed)", async () => {
    const skip: number = 0;
    const limit: number = 10;
    const query: string = "Matte"; //sampleProduct.title;

    const trimmedProducts: ITrimmedProduct[] | IProduct[] =
      await searchProducts<typeof projectionProductTrimmed>(
        projectionProductTrimmed,
        query,
        skip,
        limit,
      );

    if (!trimmedProducts) expect(false);

    //#Products <= limit
    expect(trimmedProducts.length).toBeLessThanOrEqual(limit);

    expect(lookForQuery(query, trimmedProducts)).toBe(true);

    validateTrimmedProductSchema(trimmedProducts);

  });

  it("should return no product", async () => {
    const skip: number = 0;
    const limit: number = 10;
    //A query that shoould not exit in your Db
    const query: string = "L'Amour Toujours";

    const products: ITrimmedProduct[] | IProduct[] = await searchProducts<null>(
      null,
      query,
      skip,
      limit,
    );

    expect(products.length).toBe(0);
  });
});


//Suite to Test Browse Product
describe("Fetch All", () => {
  
  it("should fetch products within limit", async () => {
    const skip: number = 20;
    const limit: number = 10;

    const productAll = await getAllProducts<null>(null, skip, limit);
    expect(limit).toBe(productAll.length);

    validateProductSchema(productAll);
  });

  it("should fetch products (Trimmed) within limit", async () => {
    const skip: number = 20;
    const limit: number = 10;

    const productAll = await getAllProducts<typeof projectionProductTrimmed>(
      projectionProductTrimmed,
      skip,
      limit,
    );
    expect(limit).toBe(productAll.length);

    validateTrimmedProductSchema(productAll);

  });

  it("should return no product - querying beyond total number of products", async () => {
    const totalDocumentCount: number = await dBase
      .collection("inventory")
      .countDocuments();
    const skip: number = totalDocumentCount + 20;
    const limit: number = 10;

    const productAll = await getAllProducts<null>(null, skip, limit);
    //console.log(skip);
    expect(productAll.length).toBe(0);
  });

});
