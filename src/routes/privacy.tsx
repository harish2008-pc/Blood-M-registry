import { createFileRoute, Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { EMERGENCY_NOTICE } from "@/lib/registry";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & consent — Blood Management Registry" },
      {
        name: "description",
        content:
          "What the registry stores, who can see it, how contact reveals are logged and how a donor withdraws consent.",
      },
      { property: "og:title", content: "Privacy & consent" },
      {
        property: "og:description",
        content: "How donor data is stored, shown and deleted in the registry.",
      },
    ],
  }),
  component: Privacy,
});

const sections = [
  {
    title: "What we store",
    body: "Name, area/locality, city, phone number, optional email, blood group, availability, an optional last donation date and your emergency-contact preference.",
  },
  {
    title: "What the public sees",
    body: "Search results show a shortened name (for example “Asha K.”), blood group, area, city, availability and whether the record was verified. Phone numbers, emails and full addresses are never included in search results.",
  },
  {
    title: "How contact details are released",
    body: "A phone number is only shown after a signed-in person deliberately clicks “Reveal contact”. Each reveal is logged with the account that requested it so that misuse can be investigated.",
  },
  {
    title: "Consent is required and reversible",
    body: "No record is listed without an explicit consent tick. A donor can withdraw consent at any time from the donor portal — this removes the record from the registry, or deletes it completely if they choose.",
  },
  {
    title: "Reporting incorrect data",
    body: "Anyone can flag a record as wrong, outdated or misused. Reports are reviewed by administrators, who can correct, unverify or deactivate the record.",
  },
  {
    title: "Demo records",
    body: "Records prefixed with “DEMO” are sample data created to show how the app works. They do not describe real people and their phone numbers are not real.",
  },
];

function Privacy() {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("Privacy & consent")}</h1>
      <p className="mt-3 text-muted-foreground">
        {t(
          "This registry only exists because volunteers choose to be listed. We keep the data minimal and the exposure low.",
        )}
      </p>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{t(section.title)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(section.body)}</p>
          </section>
        ))}
      </div>

      <Alert className="mt-8">
        <AlertTitle>{t("Emergency guidance")}</AlertTitle>
        <AlertDescription>{t(EMERGENCY_NOTICE)}</AlertDescription>
      </Alert>

      <Button asChild className="mt-8" variant="outline">
        <Link to="/how-it-works">{t("Read how it works")}</Link>
      </Button>
    </div>
  );
}
