import { SellerProfile } from "../models/SellerProfile";
import {
  ISellerProfileInput,
  SellerProfileStatus,
} from "../interfaces/sellerProfile.interface";

export class SellerService {
  static async getProfileByUser(userId: string) {
    return SellerProfile.findOne({ user: userId }).lean();
  }

  static async upsertProfile(userId: string, payload: ISellerProfileInput) {
    const existing = await SellerProfile.findOne({ user: userId });
    if (!existing) {
      const profile = await SellerProfile.create({
        ...payload,
        user: userId,
        status: "pending",
        submittedAt: new Date(),
      });
      return profile;
    }

    const nextStatus: SellerProfileStatus =
      existing.status === "rejected" ? "pending" : existing.status;

    existing.set({
      ...payload,
      status: nextStatus,
      rejectionReason: nextStatus === "pending" ? undefined : existing.rejectionReason,
      submittedAt: nextStatus === "pending" ? new Date() : existing.submittedAt,
    });

    await existing.save();
    return existing;
  }

  static async updateProfile(userId: string, payload: Partial<ISellerProfileInput>) {
    const profile = await SellerProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Seller profile not found");
    }

    const wasRejected = profile.status === "rejected";
    profile.set({
      ...payload,
      status: wasRejected ? "pending" : profile.status,
      rejectionReason: wasRejected ? undefined : profile.rejectionReason,
      submittedAt: wasRejected ? new Date() : profile.submittedAt,
    });

    await profile.save();
    return profile;
  }

  static async listProfiles(
    status?: SellerProfileStatus,
    page = 1,
    limit = 20
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const filter = status ? { status } : {};

    const [profiles, total] = await Promise.all([
      SellerProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      SellerProfile.countDocuments(filter),
    ]);

    return {
      profiles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
      },
    };
  }

  static async approveSeller(sellerId: string) {
    const profile = await SellerProfile.findOne({ user: sellerId });
    if (!profile) {
      throw new Error("Seller profile not found");
    }
    profile.status = "approved";
    profile.approvedAt = new Date();
    profile.rejectionReason = undefined;
    await profile.save();
    return profile;
  }

  static async rejectSeller(sellerId: string, reason?: string) {
    const profile = await SellerProfile.findOne({ user: sellerId });
    if (!profile) {
      throw new Error("Seller profile not found");
    }
    profile.status = "rejected";
    profile.rejectionReason = reason?.trim() || "Rejected by admin";
    profile.approvedAt = undefined;
    await profile.save();
    return profile;
  }
}
