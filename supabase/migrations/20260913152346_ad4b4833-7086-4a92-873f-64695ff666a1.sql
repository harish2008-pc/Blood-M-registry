
CREATE OR REPLACE FUNCTION public.get_donor_public(p_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  locality text,
  city text,
  blood_group public.blood_group,
  availability public.availability_status,
  verified boolean,
  is_demo boolean,
  last_donation_date date,
  emergency_contact_ok boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id,
         split_part(d.full_name, ' ', 1) || CASE WHEN position(' ' in d.full_name) > 0
           THEN ' ' || upper(substr(split_part(d.full_name, ' ', 2), 1, 1)) || '.' ELSE '' END,
         d.locality, d.city, d.blood_group, d.availability, d.verified, d.is_demo,
         d.last_donation_date, d.emergency_contact_ok
  FROM public.donors d
  WHERE d.id = p_id AND d.active = true AND d.consent_given = true;
$$;
REVOKE EXECUTE ON FUNCTION public.get_donor_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_donor_public(uuid) TO anon, authenticated;
