import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

// Custom validation error class
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  errors: any;
  
  constructor(message: string, errors: any) {
    super(message);
    this.errors = errors;
  }
}

// Type for validation targets
type ValidationTarget = 'body' | 'params' | 'query' | 'headers';

// Validation middleware factory
export const validate = (
  schema: z.ZodSchema<any>,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      let dataToValidate: any;
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'headers':
          dataToValidate = req.headers;
          break;
        default:
          dataToValidate = req.body;
      }

      // Validate the data
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'headers':
          req.headers = validatedData;
          break;
      }

      next();
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as any).received
        }));

        logger.warn({
          message: 'Validation failed',
          target,
          errors: validationErrors,
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        const validationError = new ValidationError(
          'Input validation failed',
          validationErrors
        );
        
        return next(validationError);
      }
      
      // Pass through other errors
      next(error);
    }
  };
};

// Middleware to validate multiple targets
export const validateMultiple = (validations: Array<{
  schema: z.ZodSchema<any>;
  target: ValidationTarget;
}>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];
    
    for (const validation of validations) {
      try {
        let dataToValidate: any;
        switch (validation.target) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'headers':
            dataToValidate = req.headers;
            break;
        }

        const validatedData = validation.schema.parse(dataToValidate);
        
        // Update the request object
        switch (validation.target) {
          case 'body':
            req.body = validatedData;
            break;
          case 'params':
            req.params = validatedData;
            break;
          case 'query':
            req.query = validatedData;
            break;
          case 'headers':
            req.headers = validatedData;
            break;
        }
        
      } catch (error) {
        if (error instanceof ZodError) {
          const validationErrors = error.errors.map(err => ({
            target: validation.target,
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: (err as any).received
          }));
          errors.push(...validationErrors);
        }
      }
    }
    
    if (errors.length > 0) {
      logger.warn({
        message: 'Multiple validation failed',
        errors,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const validationError = new ValidationError(
        'Input validation failed',
        errors
      );
      
      return next(validationError);
    }
    
    next();
  };
};

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
};

// File upload validation
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    
    if (!file) {
      return next();
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new ValidationError(
        'Invalid file type',
        [{
          field: 'file',
          message: `File type must be one of: ${allowedTypes.join(', ')}`,
          received: file.mimetype
        }]
      );
      return next(error);
    }

    // Check file size
    if (file.size > maxSize) {
      const error = new ValidationError(
        'File too large',
        [{
          field: 'file',
          message: `File size must not exceed ${maxSize / 1024 / 1024}MB`,
          received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        }]
      );
      return next(error);
    }

    next();
  };
};

// IP address validation
export const validateIP = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  
  // Log suspicious requests
  if (!ip || !userAgent) {
    logger.warn({
      message: 'Request missing IP or User-Agent',
      ip,
      userAgent,
      url: req.url,
      method: req.method
    });
  }
  
  next();
};

// Request ID validation
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.get('X-Request-ID') || 
    `lotus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};