-- 00009_product_variants.sql

-- 1. Add new fields to products table for fashion-specific data
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 2. Create product_options table
CREATE TABLE public.product_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g. "Size", "Color"
    position INTEGER DEFAULT 0,
    values JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings e.g. ["M", "L", "XL"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, name)
);

-- 3. Create product_variants table
CREATE TABLE public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- e.g. "Black / M"
    price DECIMAL(12, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    image_url TEXT,
    options JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"Size": "M", "Color": "Black"}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_options
CREATE POLICY "Public can view options of published products" ON public.product_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = product_options.product_id AND p.is_published = true AND s.is_active = true
    )
  );

CREATE POLICY "Sellers manage own product options" ON public.product_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = product_options.product_id AND s.user_id = auth.uid()
    )
  );

-- 6. RLS Policies for product_variants
CREATE POLICY "Public can view variants of published products" ON public.product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = product_variants.product_id AND p.is_published = true AND s.is_active = true
    )
  );

CREATE POLICY "Sellers manage own product variants" ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON p.store_id = s.id
      WHERE p.id = product_variants.product_id AND s.user_id = auth.uid()
    )
  );

-- 7. Add triggers for updated_at
CREATE TRIGGER update_product_options_modtime
    BEFORE UPDATE ON public.product_options
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_product_variants_modtime
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

