// types/express.d.ts
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }

  interface PaginationQuery {
    page?: string;
    limit?: string;
  }

  interface SearchQuery {
    q?: string;
    page?: string;
    limit?: string;
  }
  
}
