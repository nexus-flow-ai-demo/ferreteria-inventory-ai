import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, Download, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { AppHeader } from '@/components/AppHeader';
import { TotalCard } from '@/components/TotalCard';
import { InvoicesTable } from '@/components/InvoicesTable';
import { ScannerModal } from '@/components/ScannerModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { useInvoices, useCreateInvoice } from '@/hooks/useInvoices';
import { useTenant } from '@/hooks/useTenant';
import { exportToCsv } from '@/lib/exportCsv';

const spring = { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 };

export default function Index() {
  const { userId } = useTenant();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: invoices, isLoading } = useInvoices(userId, dateRange);
  const createInvoice = useCreateInvoice();

  const total = useMemo(
    () => invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) ?? 0,
    [invoices]
  );

  const handleSave = (data: {
    issuer_name: string;
    issuer_tax_id: string;
    address: string;
    date: string;
    amount: number;
    concept: string;
  }) => {
    createInvoice.mutate(
      { ...data, tenant_id: userId },
      {
        onSuccess: () => {
          setScannerOpen(false);
          toast.success('Gasto guardado');
        },
        onError: () => {
          toast.error('Error al guardar el gasto');
        },
      }
    );
  };

  const handleExport = () => {
    if (!invoices?.length) return;
    const from = dateRange.from.toISOString().split('T')[0];
    const to = dateRange.to.toISOString().split('T')[0];
    exportToCsv(invoices, from, to);
    toast.success('CSV descargado');
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Total Card */}
        <TotalCard total={total} count={invoices?.length ?? 0} />

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-0 bg-card shadow-card hover:shadow-card-hover text-sm gap-2 h-10"
              onClick={handleExport}
              disabled={!invoices?.length}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>

            {/* Desktop scan button */}
            <Button
              className="rounded-lg text-sm gap-2 h-10 hidden md:flex"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="h-4 w-4" />
              Escanear Factura
            </Button>
          </div>
        </div>

        {/* Table */}
        <InvoicesTable invoices={invoices} loading={isLoading} />
      </main>

      {/* Mobile FAB */}
      <motion.button
        className="md:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center z-50"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={spring}
        onClick={() => setScannerOpen(true)}
        aria-label="Escanear Factura"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onSave={handleSave}
        saving={createInvoice.isPending}
      />
    </div>
  );
}
