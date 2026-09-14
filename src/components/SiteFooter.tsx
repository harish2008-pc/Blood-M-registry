import { Link } from "@tanstack/react-router";
import { EMERGENCY_NOTICE } from "@/lib/registry";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();

  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold">BloodBridge</p>
          <p className="mt-2 max-w-md text-muted-foreground">{t(EMERGENCY_NOTICE)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground">
            {t("How it works")}
          </Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
            {t("Privacy & consent")}
          </Link>
          <Link to="/register" className="text-muted-foreground hover:text-foreground">
            {t("Register as donor")}
          </Link>
          <p className="text-xs text-muted-foreground">
            {t("Demo records are clearly labelled and do not describe real people.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
