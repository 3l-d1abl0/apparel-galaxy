import express, { Express, Request, Response } from "express";
import cartRoutes from './routes/cartController.js';
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

app.use(secured);
app.use('/cart', cartRoutes);

interface ResponseError extends Error {
  status?: number;
}


//If no match by earlier Routes
app.use((req: Request, res: Response, next) => {
  res.status(404).json({ message: `Requested route ${req.url} does not exist!` });
});

app.use((error: ResponseError, req: Request, res: Response) => {

  res.status(error.status || 500);
  res.json({
      error: {
          message: error.message
      }
  });
});

export { app };