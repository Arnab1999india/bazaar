import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { auth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const controller = new UserController();

router.get(
  "/me",
  auth,
  asyncHandler(controller.getProfile.bind(controller))
);

router.patch(
  "/profile",
  auth,
  asyncHandler(controller.updateProfile.bind(controller))
);

router.get(
  "/search",
  auth,
  asyncHandler(controller.searchByUsername.bind(controller))
);

router.get(
  "/suggestions",
  auth,
  asyncHandler(controller.getSuggestions.bind(controller))
);

export default router;
