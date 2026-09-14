
CREATE TYPE public.report_status AS ENUM ('open', 'in_review', 'action_taken', 'dismissed');

ALTER TABLE public.donor_reports
  ADD COLUMN status public.report_status NOT NULL DEFAULT 'open',
  ADD COLUMN admin_notes text,
  ADD COLUMN reviewed_by uuid,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.donor_reports SET status = 'action_taken' WHERE resolved = true;

CREATE TRIGGER donor_reports_set_updated_at
BEFORE UPDATE ON public.donor_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.donor_reports(id) ON DELETE CASCADE,
  from_status public.report_status,
  to_status public.report_status NOT NULL,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.report_events TO authenticated;
GRANT ALL ON public.report_events TO service_role;

ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read report events" ON public.report_events
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins add report events" ON public.report_events
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND actor_id = auth.uid());

CREATE INDEX report_events_report_id_idx ON public.report_events(report_id, created_at DESC);

INSERT INTO public.report_events (report_id, from_status, to_status, note, created_at)
SELECT id, NULL, 'open', 'Report submitted', created_at FROM public.donor_reports;

CREATE OR REPLACE FUNCTION public.review_report(p_report_id uuid, p_status public.report_status, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_from public.report_status;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT status INTO v_from FROM public.donor_reports WHERE id = p_report_id;
  IF v_from IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;
  UPDATE public.donor_reports
     SET status = p_status,
         resolved = (p_status IN ('action_taken', 'dismissed')),
         admin_notes = COALESCE(NULLIF(p_note, ''), admin_notes),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = p_report_id;
  INSERT INTO public.report_events (report_id, from_status, to_status, note, actor_id)
  VALUES (p_report_id, v_from, p_status, NULLIF(p_note, ''), auth.uid());
END; $$;

REVOKE EXECUTE ON FUNCTION public.review_report(uuid, public.report_status, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_report(uuid, public.report_status, text) TO authenticated;
