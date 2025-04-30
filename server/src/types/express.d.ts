// Type declarations for modules that are causing build errors
declare module 'express' {
  export interface Request {
    user?: any;
    token?: string;
    cookies?: any;
    query?: any;
    params?: any;
    secure?: boolean;
    body?: any;
    headers: {
      origin?: string;
      authorization?: string;
      [key: string]: any;
    };
  }
  
  export interface Response {
    status(code: number): Response;
    json(data: any): Response;
    redirect(url: string): void;
    setHeader(name: string, value: string): Response;
    cookie(name: string, value: string, options?: any): Response;
    on(event: string, callback: Function): void;
    end(): void;
  }
  
  export type NextFunction = (err?: any) => void;
}

declare module 'cors';
declare module 'cookie-parser'; 