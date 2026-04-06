import type { Invoice } from '@/lib/supabase';

export function exportToCsv(invoices: Invoice[], startDate: string, endDate: string) {
  const headers = ['Fecha', 'Comercio', 'RIF', 'Dirección', 'Monto', 'Concepto'];
  const rows = invoices.map(inv => [
    inv.date,
    inv.issuer_name,
    inv.issuer_tax_id || '',
    inv.address || '',
    inv.amount.toString(),
    inv.concept || '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gastos_${startDate}_to_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
