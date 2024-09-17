import express, { Express, Request, Response } from "express";
import { config } from './config/config.js';

const app: Express = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received request for ${req.url} from ${req.ip}`);
  next();
});


interface ResponseError extends Error {
  status?: number;
}


//If no match by earlier Routes
app.use((req: Request, res: Response, next) => {
  const error: ResponseError= new Error('Not Found !');
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