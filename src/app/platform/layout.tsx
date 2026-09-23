'use client';

import { PlatformAuthProvider } from '@/hooks/use-platform-auth';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformAuthProvider>{children}</PlatformAuthProvider>;
}
