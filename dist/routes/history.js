"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHistoryRouter = createHistoryRouter;
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const validation_1 = require("../utils/validation");
function createHistoryRouter(historyRepository) {
    const router = (0, express_1.Router)();
    router.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { limit } = validation_1.historyQuerySchema.parse({
            limit: req.query.limit ?? 10
        });
        res.json({
            items: historyRepository.listRecent(limit)
        });
    }));
    return router;
}
