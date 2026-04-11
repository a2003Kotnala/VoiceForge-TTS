import { Router } from "express";

import type { HistoryRepository } from "../db/historyRepository";
import { asyncHandler } from "../utils/asyncHandler";
import { historyQuerySchema } from "../utils/validation";

export function createHistoryRouter(historyRepository: HistoryRepository) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { limit } = historyQuerySchema.parse({
        limit: req.query.limit ?? 10
      });

      res.json({
        items: historyRepository.listRecent(limit)
      });
    })
  );

  return router;
}
