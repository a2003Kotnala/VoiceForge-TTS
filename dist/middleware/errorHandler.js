"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
function notFoundHandler(_req, res) {
    res.status(404).json({
        error: "Route not found."
    });
}
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed.",
            details: error.flatten()
        });
    }
    if (error instanceof errors_1.AppError) {
        return res.status(error.statusCode).json({
            error: error.message,
            details: error.details
        });
    }
    logger_1.logger.error({
        error
    }, "Unhandled application error");
    return res.status(500).json({
        error: "Internal server error."
    });
}
