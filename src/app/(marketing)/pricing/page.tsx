import React from 'react';
import { getSession } from '@/lib/session';
import { ensureStandardPlans } from '@/lib/subscription/ensure-plans';
import PricingView, { PricingPlanItem } from '@/components/marketing/PricingView';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const session = await getSession();

  let dbPlans: PricingPlanItem[] = [];
  try {
    const plans = await ensureStandardPlans();
    dbPlans = plans.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price.toString(),
      durationDays: p.durationDays,
    }));
  } catch {
    dbPlans = [];
  }

  return <PricingView isAuthenticated={Boolean(session)} plans={dbPlans} />;
}
