'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/page-header';

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((m) => m.Scanner),
  { ssr: false },
);

const extractTokenFromUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/q\/([^/?#]+)/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  if (/^[a-f0-9-]{32,}$/i.test(trimmed)) return trimmed;
  return null;
};

export default function ScannerPage() {
  const router = useRouter();
  const [manual, setManual] = useState('');
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  const goToToken = (raw: string) => {
    const token = extractTokenFromUrl(raw);
    if (!token) {
      toast.error('QR/URL không hợp lệ');
      return;
    }
    router.push(`/q/${token}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quét QR đơn hàng"
        description="Mở camera để quét QR, hoặc dán URL/token thủ công"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ScanLine className="h-4 w-4" />
            <CardTitle>Camera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Scanner
                onScan={(codes) => {
                  const value = codes[0]?.rawValue;
                  if (!value || value === lastDetected) return;
                  setLastDetected(value);
                  goToToken(value);
                }}
                onError={(err) => {
                  console.warn('[scanner]', err);
                }}
                constraints={{ facingMode: 'environment' }}
                styles={{ container: { width: '100%' } }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Đưa QR vào khung hình. Sau khi quét xong sẽ tự động mở trang đơn.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nhập thủ công</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                goToToken(manual);
              }}
              className="space-y-3"
            >
              <div className="space-y-2">
                <Label htmlFor="manual">URL hoặc token</Label>
                <Input
                  id="manual"
                  placeholder="https://.../q/abc-... hoặc UUID"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Mở đơn
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
