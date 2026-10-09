-- View for Maji HQ to safely query users combining auth, profiles, admin_users, and stores
CREATE OR REPLACE VIEW public.hq_users_directory AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.full_name,
    p.phone,
    p.avatar_url,
    (adm.user_id IS NOT NULL) as is_admin,
    (s.id IS NOT NULL) as is_seller,
    s.id as store_id,
    s.name as store_name,
    s.slug as store_slug,
    s.is_active as store_active
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.admin_users adm ON au.id = adm.user_id
LEFT JOIN public.stores s ON p.id = s.user_id;

-- Only service_role needs access to this view since it's an HQ admin feature
-- Revoke all from anon and authenticated just in case
REVOKE ALL ON public.hq_users_directory FROM anon, authenticated;
GRANT SELECT ON public.hq_users_directory TO service_role;
