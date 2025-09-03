import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare class ValidationError extends Error {
    statusCode: number;
    code: string;
    errors: any;
    constructor(message: string, errors: any);
}
type ValidationTarget = 'body' | 'params' | 'query' | 'headers';
export declare const validate: (schema: z.ZodSchema<any>, target?: ValidationTarget) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMultiple: (validations: Array<{
    schema: z.ZodSchema<any>;
    target: ValidationTarget;
}>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeString: (str: string) => string;
export declare const validateFileUpload: (allowedTypes?: string[], maxSize?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateIP: (req: Request, res: Response, next: NextFunction) => void;
export declare const addRequestId: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validation.middleware.d.ts.map