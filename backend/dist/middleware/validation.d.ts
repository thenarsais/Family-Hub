/**
 * Request Validation Middleware
 * Validates and sanitizes incoming requests
 */
import { Request, Response, NextFunction } from 'express';
export interface ValidationRule {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | Promise<boolean>;
    message?: string;
}
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
/**
 * Create validation middleware for a schema
 */
export declare function validate(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Quick validation for a single request
 */
export declare function validateRequest(data: any, schema: ValidationSchema): Promise<{
    valid: boolean;
    errors?: Record<string, string>;
    data?: any;
}>;
declare const _default: {
    validate: typeof validate;
    validateRequest: typeof validateRequest;
};
export default _default;
//# sourceMappingURL=validation.d.ts.map