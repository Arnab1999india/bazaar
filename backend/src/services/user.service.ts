import mongoose from "mongoose";
import { User, IUserDocument } from "../models/User";
import { UserRole } from "../interfaces/user.interface";

const AGE_DIFF_MS = 1000 * 60 * 60 * 24 * 365;

type LeanUser = Pick<
  IUserDocument,
  | "name"
  | "email"
  | "role"
  | "phone"
  | "firstName"
  | "lastName"
  | "bio"
  | "dateOfBirth"
  | "locationCity"
  | "locationCountry"
  | "educationSchool"
  | "educationCollege"
  | "profileImageUrl"
> & {
  _id: mongoose.Types.ObjectId;
};

export class UserService {
  static async findById(userId: string) {
    return User.findById(userId);
  }

  static async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  }

  static async findByUsername(name: string) {
    return User.findOne({ name });
  }

  static async updateProfile(
    userId: string,
    updates: Record<string, unknown>
  ) {
    const allowedFields = [
      "name",
      "phone",
      "firstName",
      "lastName",
      "bio",
      "dateOfBirth",
      "locationCity",
      "locationCountry",
      "educationSchool",
      "educationCollege",
      "profileImageUrl",
    ];

    const normalized: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        normalized[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, normalized, {
      new: true,
    }).lean();

    if (!user) {
      throw new Error("User not found");
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  static async getSuggestedFriends(userId: string, limit = 10) {
    const requester = (await User.findById(userId).lean()) as LeanUser | null;
    if (!requester) {
      throw new Error("User not found");
    }

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          _id: { $ne: requester._id },
          role: { $in: [UserRole.CUSTOMER, UserRole.SELLER] },
        },
      },
      {
        $addFields: {
          matchScore: {
            $add: [
              requester.locationCity
                ? {
                    $cond: [
                      {
                        $eq: [
                          {
                            $ifNull: ["$locationCity", ""],
                          },
                          requester.locationCity,
                        ],
                      },
                      3,
                      0,
                    ],
                  }
                : 0,
              requester.educationCollege
                ? {
                    $cond: [
                      {
                        $eq: [
                          {
                            $ifNull: ["$educationCollege", ""],
                          },
                          requester.educationCollege,
                        ],
                      },
                      2,
                      0,
                    ],
                  }
                : 0,
              requester.educationSchool
                ? {
                    $cond: [
                      {
                        $eq: [
                          {
                            $ifNull: ["$educationSchool", ""],
                          },
                          requester.educationSchool,
                        ],
                      },
                      1,
                      0,
                    ],
                  }
                : 0,
              requester.dateOfBirth
                ? {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$dateOfBirth", null] },
                          {
                            $lte: [
                              {
                                $abs: {
                                  $divide: [
                                    {
                                      $subtract: ["$dateOfBirth", requester.dateOfBirth],
                                    },
                                    AGE_DIFF_MS,
                                  ],
                                },
                              },
                              3,
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  }
                : 0,
            ],
          },
        },
      },
      {
        $sort: { matchScore: -1, createdAt: -1 },
      },
      {
        $limit: Math.min(Math.max(Number(limit) || 10, 1), 50),
      },
      {
        $project: {
          password: 0,
          matchScore: 0,
        },
      },
    ];

    const suggestions = await User.aggregate(pipeline);
    return suggestions.filter((user) => user.matchScore > 0);
  }
}
