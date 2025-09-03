import { Request, Response, NextFunction } from 'express';
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    optionsSuccessStatus: number;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
};
export declare const apiSecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadSecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContentType: (allowedTypes?: string[]) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=security.middleware.d.ts.map