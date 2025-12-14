import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller";
import { auth, optionalAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const controller = new CatalogController();

router.get(
  "/categories",
  asyncHandler(controller.getCategories.bind(controller))
);

router.get("/brands", asyncHandler(controller.getBrands.bind(controller)));

router.get("/deals", asyncHandler(controller.getDeals.bind(controller)));

router.get(
  "/bestsellers",
  asyncHandler(controller.getBestsellers.bind(controller))
);

router.get(
  "/recently-viewed",
  auth,
  asyncHandler(controller.getRecentlyViewed.bind(controller))
);

router.post(
  "/events/view",
  optionalAuth,
  asyncHandler(controller.trackView.bind(controller))
);

export default router;
