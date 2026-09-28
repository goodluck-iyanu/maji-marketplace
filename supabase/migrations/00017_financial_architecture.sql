-- Configurable platform settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY,
    commission_percentage DECIMAL(5,2) DEFAULT 4.00,
    commission_fixed_fee DECIMAL(10,2) DEFAULT 50.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config (1 row only)
INSERT INTO public.platform_settings (id, commission_percentage, commission_fixed_fee)
SELECT '00000000-0000-0000-0000-000000000001', 4.00, 50.00
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- Extend orders table for financial tracking
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS product_subtotal DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seller_amount DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paystack_fee DECIMAL(12, 2) DEFAULT 0;

-- Financial Ledger for auditable accounting
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL, -- 'product_sale', 'platform_fee', 'delivery_fee', 'payout'
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can view own transactions" ON public.financial_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Admins can view all transactions" ON public.financial_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

