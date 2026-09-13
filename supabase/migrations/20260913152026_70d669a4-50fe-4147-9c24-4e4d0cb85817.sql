
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.search_donors(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_donors(text, text, text, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reveal_donor_contact(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
