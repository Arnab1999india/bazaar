import { Router } from "express";
import Joi from "joi";
import { SellerController } from "../controllers/seller.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

const rejectSchema = Joi.object({
  reason: Joi.string().min(3).required(),
});

router.use(auth, authorize(UserRole.ADMIN));

router.get("/", SellerController.listSellers);
router.patch("/:sellerId/approve", SellerController.approveSeller);
router.patch(
  "/:sellerId/reject",
  validateRequest(rejectSchema),
  SellerController.rejectSeller
);

export default router;
