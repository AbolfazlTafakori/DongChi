import React from 'react';
import { getPublicFaqs } from '@/lib/faq-store';
import { getSession } from '@/lib/session';
import FaqClientView from '@/components/marketing/FaqClientView';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const session = await getSession();
  const faqs = getPublicFaqs();

  return <FaqClientView initialFaqs={faqs} isAuthenticated={Boolean(session)} />;
}
