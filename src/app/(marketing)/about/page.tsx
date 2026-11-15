import React from 'react';
import { getSession } from '@/lib/session';
import AboutClientView from '@/components/marketing/AboutClientView';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const session = await getSession();
  return <AboutClientView isAuthenticated={Boolean(session)} />;
}
