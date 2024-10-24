import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database',
    db: process.env.MONGO_DB || 'apparel-galaxy',
    inventory_collection: process.env.MONGO_INVENTORY_COLLECTION || 'inventory',
    user_collection: process.env.MONGO_USER_COLLECTION || 'users',
    cart_collection: process.env.MONGO_CART_COLLECTION || 'cart',
  },
  port: process.env.PORT || 3000,
  SERVICE_NAME: process.env.SERVICE_NAME || "product-service",
  AUTH_SERVICE: process.env.AUTH_SERVICE || "http://localhost:8000",
  ORDER_SERVICE: process.env.ORDER_SERVICE || "http://localhost:9000",
  JWT_SECRET: process.env.JWT_SECRET || "your_secret_key",
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || "HS256",
  JWT_EXPIRATION_TIME_MINUTES: process.env.JWT_EXPIRATION_TIME_MINUTES || 10,
  
};