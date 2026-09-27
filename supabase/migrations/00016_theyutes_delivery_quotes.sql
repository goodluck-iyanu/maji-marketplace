ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS pickup_house_number TEXT,
  ADD COLUMN IF NOT EXISTS pickup_area TEXT,
  ADD COLUMN IF NOT EXISTS pickup_lga TEXT,
  ADD COLUMN IF NOT EXISTS pickup_country TEXT DEFAULT 'NG',
  ADD COLUMN IF NOT EXISTS pickup_landmark TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS fragile BOOLEAN,
  ADD COLUMN IF NOT EXISTS delivery_category TEXT,
  ADD COLUMN IF NOT EXISTS service_level TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_quote JSONB;

CREATE POLICY "Store owners can record pickup address changes"
  ON public.pickup_address_changes
  FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );
