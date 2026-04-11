import { Router } from "express";
import Joi from "joi";
import { SellerController } from "../controllers/seller.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

const addressSchema = Joi.object({
  line1: Joi.string().required(),
  line2: Joi.string().allow("", null),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  postalCode: Joi.string().required(),
});

const documentSchema = Joi.object({
  type: Joi.string().required(),
  url: Joi.string().uri().required(),
});

const onboardingSchema = Joi.object({
  businessName: Joi.string().min(2).required(),
  legalName: Joi.string().allow("", null),
  businessType: Joi.string().required(),
  phone: Joi.string().min(8).required(),
  gstNumber: Joi.string().allow("", null),
  panNumber: Joi.string().allow("", null),
  shopAddress: addressSchema.required(),
  warehouseAddress: addressSchema.optional(),
  kycDocuments: Joi.array().items(documentSchema).default([]),
});

const updateSchema = onboardingSchema.fork(
  [
    "businessName",
    "businessType",
    "phone",
    "shopAddress",
  ],
  (schema) => schema.optional()
);

router.use(auth, authorize(UserRole.SELLER));

router.get("/me", SellerController.getMyProfile);
router.post(
  "/onboard",
  validateRequest(onboardingSchema),
  SellerController.onboardSeller
);
router.patch(
  "/me",
  validateRequest(updateSchema),
  SellerController.updateMyProfile
);

export default router;
