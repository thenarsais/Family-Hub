"use strict";
/**
 * Response Formatting Middleware
 * Standardizes API responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseFormatter = responseFormatter;
exports.formatResponse = formatResponse;
exports.formatPaginatedResponse = formatPaginatedResponse;
/**
 * Response formatter middleware
 */
function responseFormatter() {
    return (req, res, next) => {
        // Success response
        res.success = function (data, message, statusCode) {
            const response = {
                success: true,
                data,
                message,
                timestamp: new Date().toISOString()
            };
            return this.status(statusCode || 200).json(response);
        };
        // Created response (201)
        res.created = function (data, message) {
            return this.success(data, message || 'Resource created successfully', 201);
        };
        // No content response (204)
        res.noContent = function () {
            return this.status(204).send();
        };
        // Paginated response
        res.paginated = function (data, message, page, limit, total) {
            const response = {
                success: true,
                data,
                message,
                timestamp: new Date().toISOString(),
                meta: {
                    count: data.length,
                    ...(page !== undefined && { page }),
                    ...(limit !== undefined && { limit }),
                    ...(total !== undefined && { total })
                }
            };
            return this.status(200).json(response);
        };
        next();
    };
}
/**
 * Wrap controller response in standardized format
 */
function formatResponse(data, message, statusCode = 200) {
    return {
        success: statusCode >= 200 && statusCode < 300,
        data,
        message,
        timestamp: new Date().toISOString()
    };
}
/**
 * Wrap paginated response
 */
function formatPaginatedResponse(data, message, page, limit, total) {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        meta: {
            count: data.length,
            ...(page !== undefined && { page }),
            ...(limit !== undefined && { limit }),
            ...(total !== undefined && { total })
        }
    };
}
exports.default = {
    responseFormatter,
    formatResponse,
    formatPaginatedResponse
};
//# sourceMappingURL=response-formatter.js.map