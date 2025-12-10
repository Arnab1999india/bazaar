import { Router } from "express";
import { StoreController } from "../controllers/store.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const controller = new StoreController();

router.get(
  "/:sellerId",
  asyncHandler(controller.getStore.bind(controller))
);

router.get(
  "/:sellerId/products",
  asyncHandler(controller.getStoreProducts.bind(controller))
);

export default router;
