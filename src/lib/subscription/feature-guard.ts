import { prisma } from "@/lib/prisma";
import { Plan, Subscription, SubStatus } from "@prisma/client";
import { toPersianDigits } from "@/lib/money";

export type FeatureKey = "UNLIMITED_GROUPS" | "EXPORT_CSV" | "MULTIPLE_FUNDS";

export const FREE_MAX_GROUPS = 2;
export const FREE_MAX_FUNDS_PER_GROUP = 1;

export type SubscriptionWithPlan = Subscription & { plan: Plan };

export interface UserSubscriptionStatus {
  isPro: boolean;
  activeSubscription: SubscriptionWithPlan | null;
  remainingDays: number;
}

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  requiredFeature: FeatureKey;
}

/**
 * Checks the subscription status of a user.
 * Lazily marks expired active subscriptions as EXPIRED.
 */
export async function getUserSubscriptionStatus(
  userId: string
): Promise<UserSubscriptionStatus> {
  const now = new Date();

  // 1. Lazy update: mark any expired ACTIVE subscriptions as EXPIRED
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: SubStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    data: {
      status: SubStatus.EXPIRED,
    },
  });

  // 2. Query valid ACTIVE subscriptions with a paid plan
  const activeSubs = await prisma.subscription.findMany({
    where: {
      userId,
      status: SubStatus.ACTIVE,
      expiresAt: { gt: now },
    },
    include: {
      plan: true,
    },
    orderBy: {
      expiresAt: "desc",
    },
  });

  // A Pro subscription is an active subscription with a paid plan (price > 0)
  const proSub = activeSubs.find((sub) => sub.plan.price > 0n);

  if (proSub) {
    const remainingDays = Math.max(
      0,
      Math.ceil((proSub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      isPro: true,
      activeSubscription: proSub,
      remainingDays,
    };
  }

  // Also check if they have a free plan active subscription
  const freeSub = activeSubs[0] || null;
  const remainingDays = freeSub
    ? Math.max(
        0,
        Math.ceil((freeSub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return {
    isPro: false,
    activeSubscription: freeSub,
    remainingDays,
  };
}

/**
 * Group Halo Rule:
 * Checks if ANY member of the group currently holds an ACTIVE, non-expired Pro subscription.
 * If at least one member is Pro, the whole group is treated as Pro.
 */
export async function isGroupPro(groupId: string): Promise<boolean> {
  const now = new Date();

  // Find all user IDs in this group
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  if (members.length === 0) {
    return false;
  }

  const memberUserIds = members.map((m) => m.userId);

  // Check if any member has an active Pro subscription
  const proCount = await prisma.subscription.count({
    where: {
      userId: { in: memberUserIds },
      status: SubStatus.ACTIVE,
      expiresAt: { gt: now },
      plan: { price: { gt: 0n } },
    },
  });

  return proCount > 0;
}

/**
 * Central Feature Guard:
 * Controls access to premium features based on personal Pro status,
 * Group Halo effect, and quota limits.
 */
export async function canAccessFeature(params: {
  userId: string;
  groupId?: string;
  feature: FeatureKey;
}): Promise<FeatureAccessResult> {
  const { userId, groupId, feature } = params;

  // 1. Check user personal Pro status
  const userStatus = await getUserSubscriptionStatus(userId);
  if (userStatus.isPro) {
    return { allowed: true, requiredFeature: feature };
  }

  // 2. Feature-specific evaluations for non-Pro users
  switch (feature) {
    case "UNLIMITED_GROUPS": {
      // Free users can belong to at most FREE_MAX_GROUPS (2)
      const currentGroupCount = await prisma.groupMember.count({
        where: { userId },
      });

      if (currentGroupCount >= FREE_MAX_GROUPS) {
        return {
          allowed: false,
          reason: `در پلن رایگان می‌توانید حداکثر در ${toPersianDigits(FREE_MAX_GROUPS)} گروه عضو باشید. برای ایجاد یا پیوستن به گروه‌های بیشتر، اشتراک حرفه‌ای تهیه کنید.`,
          requiredFeature: feature,
        };
      }
      return { allowed: true, requiredFeature: feature };
    }

    case "EXPORT_CSV": {
      // Allowed if group is Pro (Group Halo effect)
      if (groupId) {
        const groupHasPro = await isGroupPro(groupId);
        if (groupHasPro) {
          return { allowed: true, requiredFeature: feature };
        }
      }

      return {
        allowed: false,
        reason:
          "خروجی فایل اکسل (CSV) نیاز به اشتراک حرفه‌ای دارد (با فعال‌سازی توسط یکی از اعضا، برای تمام اعضای این خانه باز می‌شود).",
        requiredFeature: feature,
      };
    }

    case "MULTIPLE_FUNDS": {
      // Allowed if group is Pro (Group Halo effect)
      if (groupId) {
        const groupHasPro = await isGroupPro(groupId);
        if (groupHasPro) {
          return { allowed: true, requiredFeature: feature };
        }

        // Free groups can have at most FREE_MAX_FUNDS_PER_GROUP (1)
        const currentFundCount = await prisma.fund.count({
          where: { groupId },
        });

        if (currentFundCount >= FREE_MAX_FUNDS_PER_GROUP) {
          return {
            allowed: false,
            reason: `در پلن پایه هر خانه حداکثر می‌تواند ${toPersianDigits(FREE_MAX_FUNDS_PER_GROUP)} صندوق مشترک داشته باشد. برای ثبت چند کارت بانکی یا صندوق مشترک، اشتراک حرفه‌ای نیاز است.`,
            requiredFeature: feature,
          };
        }

        return { allowed: true, requiredFeature: feature };
      }

      return {
        allowed: false,
        reason: "ایجاد صندوق‌های متعدد خانه نیاز به اشتراک حرفه‌ای دارد.",
        requiredFeature: feature,
      };
    }

    default:
      return { allowed: false, requiredFeature: feature };
  }
}
