declare global {
  namespace Express {
    interface Request {
      user?: {
        cognitoId: string;
        email: string;
        userId?: string;
      };
    }
  }
}

export {};
