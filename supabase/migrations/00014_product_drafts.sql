-- Create product_drafts table
CREATE TABLE IF NOT EXISTS public.product_drafts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    product_type TEXT NOT NULL,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, product_type)
);

-- Enable RLS
ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Sellers can manage their own drafts" 
    ON public.product_drafts 
    FOR ALL 
    USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- Create Trigger for updated_at
CREATE TRIGGER update_product_drafts_modtime
    BEFORE UPDATE ON public.product_drafts
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
