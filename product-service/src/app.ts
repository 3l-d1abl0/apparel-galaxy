import express, { Express, Request, Response } from "express";
import { config } from './config/config.js';
import productRoutes from './routes/productsController.js';
import secured from './middleware/secured.js';


const app: Express = express();

app.use(express.json());


// Middleware to log response status and time taken
app.use( (req, res, next) => {

  const startTime = Date.now();
  const logResponseTime = () => {
    const delta = Date.now() - startTime;
    console.log(`REQUEST: ${req.method} ${res.statusCode} ${req.url} ${req.ip} - Time: ${delta}ms`);
  };

  // Adding the finish listener to response object
  res.on('finish', logResponseTime);

  // Moving to the next middleware function in the stack
  next();
});

/*
Logging Mongooese Query
mongoose.set('debug', function(collectionName, methodName, ...methodArgs) {
  console.log(`${collectionName}.${methodName}(${methodArgs.join(', ')})`)

  console.log(`${collectionName}`);
  console.log(methodName);
  console.log(methodArgs);
});
*/

app.get('/ping', (req: Request, res: Response) => {
  res.send(`pong from ${config.SERVICE_NAME}`);
});

app.use(secured);
app.use('/products', productRoutes);

interface ResponseError extends Error {
  status?: number;
}


//If no match by earlier Routes
app.use((req: Request, res: Response, next) => {
  const error: ResponseError= new Error('Requested Route does not exist !');
  error.status = 404;
  next(error);
});

app.use((error: ResponseError, req: Request, res: Response, next) => {

  res.status(error.status || 500);
  res.json({
      error: {
          message: error.message
      }
  });
});

export { app };