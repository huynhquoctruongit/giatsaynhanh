import { PlatformShell } from '@/components/common/platform-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
