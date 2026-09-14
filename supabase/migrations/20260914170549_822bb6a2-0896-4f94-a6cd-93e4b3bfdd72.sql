
CREATE OR REPLACE FUNCTION public.log_report_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.report_events (report_id, from_status, to_status, note, actor_id, created_at)
  VALUES (NEW.id, NULL, NEW.status, 'Report submitted', NEW.reporter_id, NEW.created_at);
  RETURN NEW;
END; $$;

CREATE TRIGGER donor_reports_log_submitted
AFTER INSERT ON public.donor_reports
FOR EACH ROW EXECUTE FUNCTION public.log_report_submitted();
