"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParams = getParams;
exports.createRouteHandler = createRouteHandler;
/**
 * Utility to handle Next.js 15 async params compatibility
 * In Next.js 15, params is now a Promise that needs to be awaited
 */
async function getParams(request, context) {
    return await context.params;
}
/**
 * Type-safe params extractor for route handlers
 */
function createRouteHandler(handler) {
    return async (request, context) => {
        const params = await context.params;
        return handler(request, params);
    };
}
