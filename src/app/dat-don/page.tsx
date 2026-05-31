'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, PhoneCall, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bookingApi } from '@/services/api/booking.api';
import { extractError } from '@/services/api/client';

const STORAGE_KEY = 'gsn_customer';

interface Saved {
  token: string;
  name: string;
}

function loadSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v?.token ? v : null;
  } catch {
    return null;
  }
}

export default function DatDonPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'loading' | 'welcome' | 'form'>('loading');
  const [saved, setSaved] = useState<Saved | null>(null);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const s = loadSaved();
    if (s) {
      setSaved(s);
      setMode('welcome');
    } else {
      setMode('form');
    }
  }, []);

  const goToBooking = (token: string, displayName: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, name: displayName }));
    } catch {
      /* ignore (storage có thể bị chặn ở 1 số webview) */
    }
    router.replace(`/q/${token}`);
  };

  const identify = useMutation({
    mutationFn: () =>
      bookingApi.identify({
        phone: phone.trim(),
        name: name.trim() || undefined,
        address: address.trim() || undefined,
      }),
    onSuccess: (data) => goToBooking(data.token, data.name),
    onError: (err) => toast.error(extractError(err).message),
  });

  function switchUser() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setPhone('');
    setName('');
    setAddress('');
    setMode('form');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Đặt đơn giặt sấy</h1>
          <p className="text-sm text-muted-foreground">Giao nhận tận nhà — miễn phí</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {mode === 'loading' && (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải…</p>
          )}

          {mode === 'welcome' && saved && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Xin chào,</p>
                <p className="text-2xl font-extrabold">{saved.name}</p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.replace(`/q/${saved.token}`)}
              >
                Tiếp tục đặt đơn
              </Button>
              <button
                onClick={switchUser}
                className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Tôi là người khác
              </button>
            </div>
          )}

          {mode === 'form' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (phone.trim().length < 8) {
                  toast.error('Vui lòng nhập số điện thoại hợp lệ');
                  return;
                }
                identify.mutate();
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Nhập thông tin để đặt đơn. Lần sau quét mã, hệ thống sẽ tự nhận bạn.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5" /> Số điện thoại *
                </Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Tên (không bắt buộc)
                </Label>
                <Input
                  id="name"
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Địa chỉ (không bắt buộc)
                </Label>
                <Input
                  id="address"
                  placeholder="Địa chỉ nhận đồ"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={identify.isPending}>
                {identify.isPending ? 'Đang xử lý…' : 'Tiếp tục'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Thông tin của bạn chỉ dùng để giao nhận đơn giặt sấy.
        </p>
      </div>
    </div>
  );
}
