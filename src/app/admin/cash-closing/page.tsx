'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { ClosingBook } from '@/components/common/cash-closing-button';

/** Menu "Chốt két": sổ chốt két theo tháng + tổng lệch (chốt két làm ở nút giữa header / nút nổi). */
export default function CashClosingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Chốt két" description="Sổ chốt két theo tháng — tổng tiền lệch và từng ngày đã chốt" />
      <Card>
        <CardContent className="p-4 sm:p-6">
          <ClosingBook showSummary />
        </CardContent>
      </Card>
    </div>
  );
}
