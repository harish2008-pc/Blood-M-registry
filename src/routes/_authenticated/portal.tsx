import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DonorForm } from "@/components/DonorForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { availabilityLabel, type DonorFormValues } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Donor portal — Blood Management Registry" },
      {
        name: "description",
        content:
          "Update your availability and contact details, or withdraw consent and delete your donor record.",
      },
      { property: "og:title", content: "Donor portal" },
      {
        property: "og:description",
        content: "Manage your own donor record in the registry.",
      },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const donorQuery = useQuery({
    queryKey: ["my-donor", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user?.id),
  });

  const donor = donorQuery.data;

  const update = useMutation({
    mutationFn: async (values: DonorFormValues) => {
      const { error } = await supabase
        .from("donors")
        .update({
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
        })
        .eq("id", donor!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your record has been updated.");
      void queryClient.invalidateQueries({ queryKey: ["my-donor"] });
    },
    onError: () => toast.error("Could not save your changes."),
  });

  const toggleAvailability = useMutation({
    mutationFn: async () => {
      const next = donor!.availability === "available" ? "unavailable" : "available";
      const { error } = await supabase
        .from("donors")
        .update({ availability: next })
        .eq("id", donor!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability updated.");
      void queryClient.invalidateQueries({ queryKey: ["my-donor"] });
    },
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("donors")
        .update({ consent_given: false, active: false })
        .eq("id", donor!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consent withdrawn. You are no longer listed.");
      void queryClient.invalidateQueries({ queryKey: ["my-donor"] });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("donors").delete().eq("id", donor!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your record has been deleted.");
      void queryClient.invalidateQueries({ queryKey: ["my-donor"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Donor portal</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user?.email ?? "your account"}.
      </p>

      {donorQuery.isLoading && <Skeleton className="mt-6 h-64 w-full" />}

      {!donorQuery.isLoading && !donor && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>You are not on the registry yet</CardTitle>
            <CardDescription>
              Add your details so hospitals and families can reach you when your blood group is
              needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/register">Register as a donor</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {donor && (
        <div className="mt-6 space-y-6">
          <Card className="panel-shadow">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-base">{donor.blood_group}</Badge>
                <Badge variant={donor.availability === "available" ? "secondary" : "outline"}>
                  {availabilityLabel(donor.availability)}
                </Badge>
                {donor.verified && <Badge variant="secondary">Verified</Badge>}
                {!donor.consent_given && <Badge variant="destructive">Consent withdrawn</Badge>}
              </div>
              <CardTitle className="mt-2">{donor.full_name}</CardTitle>
              <CardDescription>
                {donor.locality}, {donor.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => toggleAvailability.mutate()}
                disabled={toggleAvailability.isPending || !donor.consent_given}
              >
                {donor.availability === "available"
                  ? "Mark me temporarily unavailable"
                  : "Mark me available"}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/donors/$id" params={{ id: donor.id }}>
                  View my public card
                </Link>
              </Button>
            </CardContent>
          </Card>

          {!donor.consent_given && (
            <Alert>
              <AlertTitle>You are hidden from search</AlertTitle>
              <AlertDescription>
                Save the form below to give consent again, or delete your record permanently.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Update your details</CardTitle>
              <CardDescription>Changes appear in search straight away.</CardDescription>
            </CardHeader>
            <CardContent>
              <DonorForm
                submitLabel="Save changes"
                pending={update.isPending}
                onSubmit={(values) => update.mutateAsync(values)}
                defaultValues={{
                  full_name: donor.full_name,
                  locality: donor.locality,
                  city: donor.city,
                  contact_number: donor.contact_number,
                  email: donor.email ?? "",
                  blood_group: donor.blood_group,
                  availability: donor.availability,
                  last_donation_date: donor.last_donation_date ?? "",
                  emergency_contact_ok: donor.emergency_contact_ok,
                  ...(donor.consent_given ? { consent_given: true as const } : {}),
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave the registry</CardTitle>
              <CardDescription>
                Withdrawing consent hides you immediately. Deleting removes your record completely.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => withdraw.mutate()}
                disabled={withdraw.isPending || !donor.consent_given}
              >
                Withdraw consent
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete my record</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your donor record?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes your details from the registry. This cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate()}>
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
