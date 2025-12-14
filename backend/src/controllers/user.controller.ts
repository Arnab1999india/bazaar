import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  async getProfile(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const user = await UserService.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { password, ...safeUser } = user.toJSON();
    return res.json({ success: true, data: safeUser });
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      const { dateOfBirth, ...rest } = req.body || {};
      const updates: Record<string, unknown> = { ...rest };

      if (dateOfBirth) {
        const parsed = new Date(dateOfBirth);
        if (!Number.isNaN(parsed.getTime())) {
          updates.dateOfBirth = parsed;
        }
      }

      const updated = await UserService.updateProfile(userId, updates);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to update profile" });
    }
  }

  async searchByUsername(req: Request, res: Response) {
    const username = req.query.username?.toString();
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "username query parameter is required",
      });
    }

    const user = await UserService.findByUsername(username);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  async getSuggestions(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const limit = Number(req.query.limit) || 10;
    const suggestions = await UserService.getSuggestedFriends(userId, limit);

    return res.json({
      success: true,
      data: suggestions,
    });
  }
}
