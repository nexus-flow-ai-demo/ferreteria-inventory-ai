import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const spring = { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 };

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    issuer_name: string;
    issuer_tax_id: string;
    address: string;
    date: string;
    amount: number;
    concept: string;
  }) => void;
  saving?: boolean;
}

const EMPTY_FORM = {
  issuer_name: '',
  issuer_tax_id: '',
  address: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  concept: '',
};

type Phase = 'idle' | 'analyzing' | 'form';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScannerModal({ open, onOpenChange, onSave, saving }: ScannerModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhase('analyzing');

    try {
      const imageBase64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('process-invoice', {
        body: { imageBase64 },
      });

      if (error) throw new Error(error.message || 'Error al procesar la factura');

      if (data?.error) throw new Error(data.error);

      setForm({
        issuer_name: data.issuer_name || '',
        issuer_tax_id: data.issuer_tax_id || '',
        address: data.address || '',
        date: data.date || new Date().toISOString().split('T')[0],
        amount: String(data.amount ?? ''),
        concept: data.concept || '',
      });
      setPhase('form');
    } catch (err: any) {
      console.error('AI extraction failed:', err);
      toast.error(err?.message || 'No se pudo extraer la información. Completa el formulario manualmente.');
      setForm(EMPTY_FORM);
      setPhase('form');
    } finally {
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      amount: parseFloat(form.amount) || 0,
    });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setPhase('idle');
      setForm(EMPTY_FORM);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-[1.5rem] p-0 overflow-hidden border-0 shadow-card-hover">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center gap-6"
            >
              <DialogHeader>
                <DialogTitle className="text-center">Escanear Factura</DialogTitle>
              </DialogHeader>
              <div className="h-32 w-32 rounded-2xl bg-muted flex items-center justify-center">
                <ScanLine className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Toma una foto o sube una imagen de tu factura para extraer los datos automáticamente con IA.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                className="w-full rounded-lg"
                size="lg"
                onClick={() => fileRef.current?.click()}
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Seleccionar imagen
              </Button>
            </motion.div>
          )}

          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              className="p-6 flex flex-col items-center gap-6 min-h-[300px] justify-center"
            >
              <Loader2 className="h-10 w-10 text-accent animate-spin" />
              <p className="text-lg font-semibold animate-pulse-slow">
                Analizando factura con IA...
              </p>
              <p className="text-sm text-muted-foreground">
                Extrayendo datos con Inteligencia Artificial
              </p>
            </motion.div>
          )}

          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              className="p-6"
            >
              <DialogHeader className="mb-4">
                <DialogTitle>Confirmar Datos</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="issuer_name">Comercio</Label>
                  <Input id="issuer_name" value={form.issuer_name} onChange={e => setForm(f => ({ ...f, issuer_name: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="issuer_tax_id">RIF</Label>
                    <Input id="issuer_tax_id" value={form.issuer_tax_id} onChange={e => setForm(f => ({ ...f, issuer_tax_id: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Monto ($)</Label>
                    <Input id="amount" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow tabular-nums" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="concept">Concepto</Label>
                    <Input id="concept" value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} className="rounded-lg border-0 bg-muted shadow-card focus:shadow-card-hover focus:ring-2 focus:ring-ring transition-shadow" />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-lg mt-2" size="lg" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Gasto
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
