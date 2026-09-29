'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { platformApi, type PlanConfig } from '@/services/api/platform.api';
import { extractError } from '@/services/api/client';
import { formatDateTime } from '@/lib/utils';

function formatVnd(v: number) {
  return v.toLocaleString('vi-VN') + 'đ';
}

function PlanForm({ config }: { config: PlanConfig }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(config.name);
  const [period, setPeriod] = useState(config.period);
  const [description, setDescription] = useState(config.description);
  const [price, setPrice] = useState(String(config.price));
  const [features, setFeatures] = useState(config.features.join('\n'));
  const [popular, setPopular] = useState(config.popular);

  const priceNumber = Number(price.replace(/\D/g, ''));
  const featureList = features
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  const mutation = useMutation({
    mutationFn: () =>
      platformApi.updatePlan(config.plan, {
        name: name.trim(),
        period: period.trim(),
        description: description.trim(),
        price: priceNumber,
        features: featureList,
        popular,
      }),
    onSuccess: () => {
      toast.success(`Đã lưu ${name}`);
      // Bật "phổ biến" ở gói này sẽ tắt ở gói khác — tải lại cả danh sách.
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const toggleActive = useMutation({
    mutationFn: () => (config.isActive ? platformApi.deletePlan(config.plan) : platformApi.restorePlan(config.plan)),
    onSuccess: () => {
      toast.success(config.isActive ? `Đã xoá ${config.name}` : `Đã khôi phục ${config.name}`);
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (!config.isActive) {
    return (
      <Card className="flex flex-col gap-3 border-dashed bg-muted/40 p-5 opacity-80">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">{config.plan}</span>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Đã xoá</span>
        </div>
        <p className="font-semibold">{config.name}</p>
        <p className="text-sm text-muted-foreground">
          Không hiện trên bảng giá và không kích hoạt được cho tiệm. Tiệm đang dùng gói này vẫn giữ nguyên hạn.
        </p>
        <Button variant="outline" className="w-fit" onClick={() => toggleActive.mutate()} disabled={toggleActive.isPending}>
          <RotateCcw className="h-4 w-4" /> {toggleActive.isPending ? 'Đang khôi phục…' : 'Khôi phục'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col gap-4 p-5 ${popular ? 'ring-1 ring-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{config.plan}</span>
        {popular && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Phổ biến nhất
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tên gói</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Giá (VNĐ)</Label>
          <Input
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
          />
          <p className="text-xs text-muted-foreground">
            {priceNumber === 0 ? 'Trang chủ hiện "Liên hệ báo giá"' : formatVnd(priceNumber)}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Nhãn kỳ hạn</Label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="/năm" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mô tả ngắn</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex-1 space-y-2">
        <Label>Lợi ích (mỗi dòng 1 ý)</Label>
        <Textarea
          rows={7}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder={'Quản lý đơn hàng & khách hàng\nTặng máy quét đơn'}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={popular} onCheckedChange={setPopular} />
        Gắn nhãn &quot;Phổ biến nhất&quot; (chỉ 1 gói)
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Cập nhật {formatDateTime(config.updatedAt)}
        </span>
        <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
          disabled={toggleActive.isPending}
          onClick={() =>
            window.confirm(
              `Xoá "${config.name}"?\nGói sẽ ẩn khỏi bảng giá trang chủ và không kích hoạt được cho tiệm (khôi phục lại được).`,
            ) && toggleActive.mutate()
          }
        >
          <Trash2 className="h-4 w-4" /> Xoá
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim() || !period.trim() || price === ''}
        >
          {mutation.isPending ? 'Đang lưu…' : 'Lưu'}
        </Button>
        </div>
      </div>
    </Card>
  );
}

export default function PlatformPlansPage() {
  const query = useQuery({
    queryKey: ['platform-plans'],
    queryFn: () => platformApi.listPlans(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gói dịch vụ"
        description="Giá và lợi ích từng gói — hiển thị ở mục Bảng giá trên trang chủ. Thời hạn mỗi gói cố định (6 tháng / 1 năm / 3 năm / trọn đời). Giá 0 = hiện “Liên hệ báo giá”."
      />

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[520px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.map((config) => (
            // key theo updatedAt để form nạp lại giá trị mới sau khi lưu/refetch
            <PlanForm key={`${config.plan}-${config.updatedAt}-${config.isActive}`} config={config} />
          ))}
        </div>
      )}
    </div>
  );
}
