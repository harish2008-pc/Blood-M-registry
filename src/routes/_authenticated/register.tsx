import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DonorForm } from "@/components/DonorForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EMERGENCY_NOTICE, type DonorFormValues } from "@/lib/registry";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Register as a blood donor — Blood Management Registry" },
      {
        name: "description",
        content:
          "Join the consent-based donor registry: blood group, area, availability and a contact number that stays hidden until someone asks.",
      },
      { property: "og:title", content: "Register as a blood donor" },
      {
        property: "og:description",
        content: "Add yourself to the volunteer donor registry with full control over your data.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();

  const create = useMutation({
    mutationFn: async (values: DonorFormValues) => {
      const { error } = await supabase.from("donors").insert({
        user_id: user!.id,
        full_name: values.full_name,
        locality: values.locality,
        city: values.city,
        contact_number: values.contact_number,
        email: values.email || null,
        blood_group: values.blood_group,
        availability: values.availability,
        last_donation_date: values.last_donation_date || null,
        emergency_contact_ok: values.emergency_contact_ok,
        consent_given: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("You're on the registry. Thank you."));
      navigate({ to: "/portal" });
    },
    onError: () => toast.error(t("Could not save your registration. Please try again.")),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{t("Register as a donor")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t(
          "Your details are only used to connect you with someone who needs blood. You stay in control and can leave the registry at any time.",
        )}
      </p>

      <Alert className="mt-6">
        <AlertTitle>{t("Before you register")}</AlertTitle>
        <AlertDescription>{t(EMERGENCY_NOTICE)}</AlertDescription>
      </Alert>

      <Card className="mt-6 panel-shadow">
        <CardHeader>
          <CardTitle>{t("Your details")}</CardTitle>
          <CardDescription>{t("All fields marked optional can be left blank.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DonorForm
            submitLabel={t("Join the registry")}
            pending={create.isPending}
            onSubmit={(values) => create.mutateAsync(values)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
