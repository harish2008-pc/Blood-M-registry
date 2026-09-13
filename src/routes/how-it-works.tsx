import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EMERGENCY_NOTICE, MEDICAL_NOTICE } from "@/lib/registry";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How the donor registry works — Blood Management Registry" },
      {
        name: "description",
        content:
          "How volunteers register, how searches work, what data is shown publicly and how contact details are protected.",
      },
      { property: "og:title", content: "How the donor registry works" },
      {
        property: "og:description",
        content: "Consent, privacy and search explained in plain language.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    title: "1. Volunteers register with consent",
    body: "A donor creates an account, fills in their blood group, area and contact number, and ticks an explicit consent box. Nothing is listed without that consent.",
  },
  {
    title: "2. Anyone can search",
    body: "Searching is open to everyone. Results show only a shortened name, blood group, area, city and availability — never a phone number, email or street address.",
  },
  {
    title: "3. Contact is revealed deliberately",
    body: "To see a phone number you must sign in and click “Reveal contact” on the donor's page. Every reveal is recorded so misuse can be traced.",
  },
  {
    title: "4. Donors stay in control",
    body: "From the donor portal a volunteer can change availability, update contact details, or withdraw consent and delete their record at any time.",
  },
  {
    title: "5. Administrators keep it clean",
    body: "Verified administrators review reports of incorrect data, verify records, deactivate stale ones and export the registry for blood-bank coordination.",
  },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">How it works</h1>
      <p className="mt-3 text-muted-foreground">
        A simple, consent-based directory that helps families and hospitals reach willing donors
        faster.
      </p>

      <Alert className="mt-6">
        <AlertTitle>Emergency guidance</AlertTitle>
        <AlertDescription>{EMERGENCY_NOTICE}</AlertDescription>
      </Alert>

      <div className="mt-8 space-y-4">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.body}</CardContent>
          </Card>
        ))}
      </div>

      <Alert variant="destructive" className="mt-8">
        <AlertTitle>Medical compatibility</AlertTitle>
        <AlertDescription>{MEDICAL_NOTICE}</AlertDescription>
      </Alert>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/register">Register as a donor</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Find a donor</Link>
        </Button>
      </div>
    </div>
  );
}
