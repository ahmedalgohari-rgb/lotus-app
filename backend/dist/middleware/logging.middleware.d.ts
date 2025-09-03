import { Request, Response, NextFunction } from 'express';
interface TimedRequest extends Request {
    startTime?: number;
    requestId?: string;
}
export declare const requestLogger: (req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const errorLogger: (error: any, req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const authLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLogger: {
    suspiciousActivity: (req: Request, reason: string, details?: any) => void;
    authorizationFailure: (req: Request, resource: string, action: string) => void;
    dataAccess: (req: Request, resource: string, action: string) => void;
    adminAction: (req: Request, action: string, target?: string) => void;
};
export declare const performanceMonitor: (req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const auditLogger: {
    userAction: (userId: string, action: string, details: any, performedBy?: string) => void;
    dataModification: (userId: string, resource: string, action: string, resourceId: string, changes?: any) => void;
    securityEvent: (event: string, details: any, severity?: "low" | "medium" | "high" | "critical") => void;
};
export {};
//# sourceMappingURL=logging.middleware.d.ts.map