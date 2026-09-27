CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = notifications.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = notifications.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = notifications.store_id
      AND stores.user_id = auth.uid()
    )
  );
