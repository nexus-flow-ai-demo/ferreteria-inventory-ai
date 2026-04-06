import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import type { Invoice } from '@/lib/supabase';
import { FileText } from 'lucide-react';

const spring = { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 };

interface InvoicesTableProps {
  invoices: Invoice[] | undefined;
  loading: boolean;
}

export function InvoicesTable({ invoices, loading }: InvoicesTableProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="bg-card rounded-lg shadow-card p-12 flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">No hay gastos registrados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Escanea tu primera factura para empezar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider px-4 py-3">Fecha</TableHead>
            <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider px-4 py-3">Comercio</TableHead>
            <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider px-4 py-3 hidden sm:table-cell">Concepto</TableHead>
            <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider px-4 py-3 text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence initial={false}>
            {invoices.map((inv) => (
              <motion.tr
                key={inv.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="border-0 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <TableCell className="px-4 py-3 tabular-nums text-sm">{inv.date}</TableCell>
                <TableCell className="px-4 py-3 text-sm font-medium">{inv.issuer_name}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{inv.concept || '—'}</TableCell>
                <TableCell className="px-4 py-3 tabular-nums text-sm font-semibold text-right">
                  ${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
