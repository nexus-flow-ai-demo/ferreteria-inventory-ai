import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

const spring = { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 };

interface TotalCardProps {
  total: number;
  count: number;
}

export function TotalCard({ total, count }: TotalCardProps) {
  return (
    <motion.div
      className="bg-card rounded-lg p-6 shadow-card"
      whileHover={{ y: -2 }}
      transition={spring}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-md bg-accent/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-accent" />
        </div>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Total de Gastos
        </span>
      </div>
      <p className="text-3xl font-bold tabular-nums text-foreground">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {count} {count === 1 ? 'factura' : 'facturas'}
      </p>
    </motion.div>
  );
}
