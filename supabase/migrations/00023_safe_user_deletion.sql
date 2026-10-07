-- Safe User Deletion Architecture

-- 1. Create an admin audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- 2. Modify Stores foreign key to preserve historical financials and orders
ALTER TABLE public.stores DROP CONSTRAINT stores_user_id_fkey;
ALTER TABLE public.stores ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stores ADD CONSTRAINT stores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Deactivate orphaned stores immediately upon profile deletion
CREATE OR REPLACE FUNCTION deactivate_store_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.stores SET is_active = false WHERE user_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deactivate_store ON public.profiles;
CREATE TRIGGER trigger_deactivate_store
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION deactivate_store_on_user_delete();

-- 4. Preserve Broadcast history
ALTER TABLE public.broadcasts DROP CONSTRAINT broadcasts_admin_id_fkey;
ALTER TABLE public.broadcasts ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.broadcasts ADD CONSTRAINT broadcasts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Preserve Payout audit trail
-- Note: resolved_by wasn't strictly NOT NULL, but lacked ON DELETE SET NULL
ALTER TABLE public.payout_change_requests DROP CONSTRAINT IF EXISTS payout_change_requests_resolved_by_fkey;
ALTER TABLE public.payout_change_requests ADD CONSTRAINT payout_change_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
