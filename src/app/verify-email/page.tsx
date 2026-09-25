import { Suspense } from 'react';
import VerifyEmail from '@/screens/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg dark:bg-dark-bg" />}>
      <VerifyEmail />
    </Suspense>
  );
}
