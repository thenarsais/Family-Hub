"use strict";
/**
 * Unit Tests: Validation Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../../middleware/validation");
describe('Validation Middleware', () => {
    describe('String validation', () => {
        it('should validate required string', async () => {
            const schema = {
                name: { field: 'name', type: 'string', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ name: 'John' }, schema);
            expect(result.valid).toBe(true);
            expect(result.data?.name).toBe('John');
        });
        it('should reject empty required string', async () => {
            const schema = {
                name: { field: 'name', type: 'string', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ name: '' }, schema);
            expect(result.valid).toBe(false);
            expect(result.errors?.name).toBeDefined();
        });
        it('should enforce minimum length', async () => {
            const schema = {
                password: {
                    field: 'password',
                    type: 'string',
                    required: true,
                    min: 8
                }
            };
            const result = await (0, validation_1.validateRequest)({ password: 'short' }, schema);
            expect(result.valid).toBe(false);
        });
        it('should enforce maximum length', async () => {
            const schema = {
                comment: {
                    field: 'comment',
                    type: 'string',
                    required: true,
                    max: 100
                }
            };
            const result = await (0, validation_1.validateRequest)({ comment: 'a'.repeat(101) }, schema);
            expect(result.valid).toBe(false);
        });
    });
    describe('Email validation', () => {
        it('should validate correct email', async () => {
            const schema = {
                email: { field: 'email', type: 'email', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ email: 'test@example.com' }, schema);
            expect(result.valid).toBe(true);
        });
        it('should reject invalid email', async () => {
            const schema = {
                email: { field: 'email', type: 'email', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ email: 'not-an-email' }, schema);
            expect(result.valid).toBe(false);
        });
    });
    describe('Number validation', () => {
        it('should validate number', async () => {
            const schema = {
                age: { field: 'age', type: 'number', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ age: 25 }, schema);
            expect(result.valid).toBe(true);
        });
        it('should enforce minimum value', async () => {
            const schema = {
                age: {
                    field: 'age',
                    type: 'number',
                    required: true,
                    min: 18
                }
            };
            const result = await (0, validation_1.validateRequest)({ age: 10 }, schema);
            expect(result.valid).toBe(false);
        });
        it('should enforce maximum value', async () => {
            const schema = {
                rating: {
                    field: 'rating',
                    type: 'number',
                    required: true,
                    max: 5
                }
            };
            const result = await (0, validation_1.validateRequest)({ rating: 10 }, schema);
            expect(result.valid).toBe(false);
        });
    });
    describe('Optional fields', () => {
        it('should allow missing optional field', async () => {
            const schema = {
                nickname: {
                    field: 'nickname',
                    type: 'string',
                    required: false
                }
            };
            const result = await (0, validation_1.validateRequest)({}, schema);
            expect(result.valid).toBe(true);
        });
        it('should validate optional field if provided', async () => {
            const schema = {
                nickname: {
                    field: 'nickname',
                    type: 'string',
                    required: false,
                    min: 3
                }
            };
            const result = await (0, validation_1.validateRequest)({ nickname: 'ab' }, schema);
            expect(result.valid).toBe(false);
        });
    });
    describe('Input sanitization', () => {
        it('should sanitize XSS attempts', async () => {
            const schema = {
                comment: { field: 'comment', type: 'string', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ comment: '<script>alert("xss")</script>' }, schema);
            expect(result.valid).toBe(true);
            expect(result.data?.comment).not.toContain('<script>');
        });
        it('should trim whitespace', async () => {
            const schema = {
                name: { field: 'name', type: 'string', required: true }
            };
            const result = await (0, validation_1.validateRequest)({ name: '  John  ' }, schema);
            expect(result.valid).toBe(true);
            expect(result.data?.name).toBe('John');
        });
    });
});
//# sourceMappingURL=validation.test.js.map