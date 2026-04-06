-- 1. Tabla de Facturas (Cabecera)
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    issuer_name TEXT NOT NULL,
    issuer_tax_id TEXT, -- RIF
    payment_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabla de Inventario Maestro (Stock Central)
CREATE TABLE public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    unit TEXT, -- Unidad (ej. UND, KG, MTR, PZA)
    stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    average_purchase_price NUMERIC(12,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla de Ítems Extraídos (Detalle de Factura)
CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id), -- Relación al inventario tras validación humana
    raw_item_name TEXT NOT NULL, -- Nombre tal cual lo leyó Gemini
    quantity NUMERIC(12,2) NOT NULL,
    unit TEXT,
    unit_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Políticas RLS y Permisos Básicos (Aislar por Tenant a nivel de aplicación)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
CREATE POLICY "Allow all select" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.invoices FOR DELETE USING (true);

-- Policies for inventory
CREATE POLICY "Allow all select" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.inventory FOR DELETE USING (true);

-- Policies for invoice_items
CREATE POLICY "Allow all select" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.invoice_items FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.invoice_items FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_tenant_date ON public.invoices(tenant_id, payment_date);
CREATE INDEX idx_inventory_tenant_id ON public.inventory(tenant_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_inventory_id ON public.invoice_items(inventory_id);