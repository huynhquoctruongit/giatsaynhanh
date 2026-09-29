import * as React from 'react';
import { cn } from '@/lib/utils';

/** Gán data-label (= tiêu đề cột) cho từng ô để CSS .rtable hiện dạng thẻ trên điện thoại. */
function applyCellLabels(table: HTMLTableElement) {
  const labels: string[] = [];
  table.querySelectorAll('thead tr:first-child th').forEach((th) => {
    const span = (th as HTMLTableCellElement).colSpan || 1;
    for (let i = 0; i < span; i += 1) labels.push(th.textContent?.trim() ?? '');
  });
  table.querySelectorAll('tbody tr').forEach((tr) => {
    let col = 0;
    Array.from((tr as HTMLTableRowElement).cells).forEach((td) => {
      const label = td.colSpan > 1 ? '' : (labels[col] ?? '');
      if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label);
      col += td.colSpan || 1;
    });
  });
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** false = giữ dạng bảng cả trên điện thoại (mặc định: thành thẻ khi < 768px) */
  responsive?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, responsive = true, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTableElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTableElement);

    React.useEffect(() => {
      const table = innerRef.current;
      if (!table || !responsive) return;
      applyCellLabels(table);
      // Dòng thay đổi khi dữ liệu tải lại / mở rộng → gán lại nhãn
      const observer = new MutationObserver(() => applyCellLabels(table));
      observer.observe(table, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [responsive]);

    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={innerRef}
          className={cn('w-full caption-bottom text-sm', responsive && 'rtable', className)}
          {...props}
        />
      </div>
    );
  },
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-muted/50', className)}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('h-11 px-4 text-left align-middle font-medium text-muted-foreground', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
));
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
