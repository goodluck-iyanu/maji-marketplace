-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read and update their own profile. Admins can read all.
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stores: Anyone can view active stores. Sellers manage own stores. Admins manage all.
CREATE POLICY "Public can view active stores" ON public.stores
  FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers can view own store regardless of status" ON public.stores
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Sellers can create store" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers can update own store" ON public.stores
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- Store Settings: Public can read settings of active stores. Sellers manage own settings.
CREATE POLICY "Public can view settings of active stores" ON public.store_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.is_active = true)
  );
CREATE POLICY "Sellers manage own store settings" ON public.store_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

-- Social Links: Public read. Sellers manage.
CREATE POLICY "Public can view social links of active stores" ON public.social_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.is_active = true)
  );
CREATE POLICY "Sellers manage own social links" ON public.social_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

-- Products: Public can read published products of active stores. Sellers manage own.
CREATE POLICY "Public can view published products of active stores" ON public.products
  FOR SELECT USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.is_active = true
    )
  );
CREATE POLICY "Sellers manage own products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

-- Product Images: Public read. Sellers manage.
CREATE POLICY "Public can view images of published products" ON public.product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_id AND p.is_published = true AND s.is_active = true
    )
  );
CREATE POLICY "Sellers manage own product images" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_id AND s.user_id = auth.uid()
    )
  );

-- Orders: Sellers view own store orders. Customers handled via server functions usually, but we could allow read via email/reference if needed.
-- Creating orders is handled by Server Webhooks (Service Role), so no insert policy needed for anon.
CREATE POLICY "Sellers can view own store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid()) OR is_admin()
  );
CREATE POLICY "Sellers can update fulfillment status" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );

-- Order Items: Sellers can view.
CREATE POLICY "Sellers can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_id AND s.user_id = auth.uid()
    ) OR is_admin()
  );

-- Payout Accounts: Strictly sellers and admins.
CREATE POLICY "Sellers manage own payout accounts" ON public.payout_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Admins manage payout accounts" ON public.payout_accounts
  FOR ALL USING (is_admin());

-- Payout Change Requests: Sellers create and view. Admins read and update.
CREATE POLICY "Sellers can create and view payout change requests" ON public.payout_change_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Sellers can view own payout change requests" ON public.payout_change_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Admins manage payout change requests" ON public.payout_change_requests
  FOR ALL USING (is_admin());

-- Verifications: Sellers create and view. Admins manage.
CREATE POLICY "Sellers can create verifications" ON public.verifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Sellers can view own verifications" ON public.verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Admins manage verifications" ON public.verifications
  FOR ALL USING (is_admin());

-- Admin Users: Only accessible to admins.
CREATE POLICY "Admins can read admin_users" ON public.admin_users
  FOR SELECT USING (is_admin());

