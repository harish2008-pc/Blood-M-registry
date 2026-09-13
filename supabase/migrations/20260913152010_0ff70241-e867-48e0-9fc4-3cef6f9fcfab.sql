
CREATE TYPE public.app_role AS ENUM ('admin', 'donor');
CREATE TYPE public.blood_group AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE public.availability_status AS ENUM ('available','unavailable');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  locality text NOT NULL,
  city text NOT NULL,
  contact_number text NOT NULL,
  email text,
  blood_group public.blood_group NOT NULL,
  availability public.availability_status NOT NULL DEFAULT 'available',
  last_donation_date date,
  consent_given boolean NOT NULL DEFAULT false,
  emergency_contact_ok boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX donors_search_idx ON public.donors (blood_group, city, availability);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donors TO authenticated;
GRANT ALL ON public.donors TO service_role;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donors read own" ON public.donors FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "donors insert own" ON public.donors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND consent_given = true);
CREATE POLICY "donors update own" ON public.donors FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "donors delete own" ON public.donors FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage donors" ON public.donors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.donor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  reporter_id uuid,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.donor_reports TO anon;
GRANT SELECT, INSERT, UPDATE ON public.donor_reports TO authenticated;
GRANT ALL ON public.donor_reports TO service_role;
ALTER TABLE public.donor_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can report" ON public.donor_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read reports" ON public.donor_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update reports" ON public.donor_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contact_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  revealed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_reveals TO authenticated;
GRANT ALL ON public.contact_reveals TO service_role;
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read reveals" ON public.contact_reveals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER donors_set_updated_at BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public, privacy-safe search: never returns phone, email or street address
CREATE OR REPLACE FUNCTION public.search_donors(
  p_blood_group text DEFAULT NULL,
  p_locality text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_availability text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  display_name text,
  locality text,
  city text,
  blood_group public.blood_group,
  availability public.availability_status,
  verified boolean,
  is_demo boolean,
  last_donation_date date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id,
         split_part(d.full_name, ' ', 1) || CASE WHEN position(' ' in d.full_name) > 0
           THEN ' ' || upper(substr(split_part(d.full_name, ' ', 2), 1, 1)) || '.' ELSE '' END,
         d.locality, d.city, d.blood_group, d.availability, d.verified, d.is_demo, d.last_donation_date
  FROM public.donors d
  WHERE d.active = true
    AND d.consent_given = true
    AND (p_blood_group IS NULL OR p_blood_group = '' OR d.blood_group::text = p_blood_group)
    AND (p_city IS NULL OR p_city = '' OR d.city ILIKE '%' || p_city || '%')
    AND (p_locality IS NULL OR p_locality = '' OR d.locality ILIKE '%' || p_locality || '%')
    AND (p_availability IS NULL OR p_availability = '' OR d.availability::text = p_availability)
  ORDER BY (d.availability = 'available') DESC, d.verified DESC, d.city, d.locality
  LIMIT 100;
$$;
GRANT EXECUTE ON FUNCTION public.search_donors(text, text, text, text) TO anon, authenticated;

-- Deliberate contact reveal: signed-in users only, audited
CREATE OR REPLACE FUNCTION public.reveal_donor_contact(p_donor_id uuid)
RETURNS TABLE (full_name text, contact_number text, email text, emergency_contact_ok boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required to reveal contact details';
  END IF;
  INSERT INTO public.contact_reveals (donor_id, revealed_by) VALUES (p_donor_id, auth.uid());
  RETURN QUERY
    SELECT d.full_name, d.contact_number, d.email, d.emergency_contact_ok
    FROM public.donors d
    WHERE d.id = p_donor_id AND d.active = true AND d.consent_given = true;
END; $$;
GRANT EXECUTE ON FUNCTION public.reveal_donor_contact(uuid) TO authenticated;

-- Demo bootstrap: the first signed-in user may claim the admin role
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

INSERT INTO public.donors (full_name, locality, city, contact_number, email, blood_group, availability, last_donation_date, consent_given, emergency_contact_ok, verified, is_demo)
VALUES
 ('DEMO Asha Kumar', 'Indiranagar', 'Bengaluru', '+91 90000 00001', 'demo.asha@example.invalid', 'O-', 'available', '2026-04-12', true, true, true, true),
 ('DEMO Ravi Menon', 'Adyar', 'Chennai', '+91 90000 00002', 'demo.ravi@example.invalid', 'B+', 'available', '2026-06-02', true, true, true, true),
 ('DEMO Priya Nair', 'Koramangala', 'Bengaluru', '+91 90000 00003', NULL, 'A+', 'unavailable', '2026-08-20', true, false, false, true),
 ('DEMO Imran Sheikh', 'Bandra West', 'Mumbai', '+91 90000 00004', 'demo.imran@example.invalid', 'AB+', 'available', '2026-02-15', true, true, true, true),
 ('DEMO Neha Gupta', 'Saket', 'Delhi', '+91 90000 00005', NULL, 'O+', 'available', NULL, true, false, false, true),
 ('DEMO Thomas Varghese', 'Kakkanad', 'Kochi', '+91 90000 00006', 'demo.thomas@example.invalid', 'A-', 'unavailable', '2026-07-30', true, true, true, true);
