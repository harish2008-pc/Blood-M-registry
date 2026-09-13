import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, MapPin, Phone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { availabilityLabel, EMERGENCY_NOTICE, MEDICAL_NOTICE } from "@/lib/registry";

export const Route = createFileRoute("/donors/$id")({
  head: () => ({
    meta: [
      { title: "Donor record — Blood Management Registry" },
      {
        name: "description",
        content:
          "A registered volunteer donor's public card. Contact details stay hidden until a signed-in user reveals them.",
      },
      { property: "og:title", content: "Donor record — Blood Management Registry" },
      {
        property: "og:description",
        content: "Blood group, area and availability for a consenting volunteer donor.",
      },
    ],
  }),
  component: DonorDetail,
});

type Contact = { full_name: string; contact_number: string; email: string | null };

function DonorDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const donorQuery = useQuery({
    queryKey: ["donor-public", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_donor_public", { p_id: id });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const reveal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reveal_donor_contact", { p_donor_id: id });
      if (error) throw error;
      return (data?.[0] ?? null) as Contact | null;
    },
    onSuccess: (data) => {
      setContact(data);
      toast.success("Contact revealed. This request has been logged.");
    },
    onError: () => toast.error("Could not reveal the contact. Please try again."),
  });

  const report = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("donor_reports").insert({
        donor_id: id,
        reason,
        details: details || null,
        reporter_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReason("");
      setDetails("");
      toast.success("Thank you — an administrator will review this record.");
    },
    onError: () => toast.error("Could not send the report. Please try again."),
  });

  const donor = donorQuery.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/">
          <ArrowLeft className="mr-1 size-4" /> Back to search
        </Link>
      </Button>

      {donorQuery.isLoading && <Skeleton className="h-56 w-full" />}

      {!donorQuery.isLoading && !donor && (
        <Card>
          <CardHeader>
            <CardTitle>Record not available</CardTitle>
            <CardDescription>
              This donor record has been removed, deactivated, or consent was withdrawn.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {donor && (
        <div className="space-y-6">
          <Card className="panel-shadow">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-base">{donor.blood_group}</Badge>
                {donor.verified && (
                  <Badge variant="secondary">
                    <BadgeCheck className="mr-1 size-3.5" /> Verified
                  </Badge>
                )}
                {donor.is_demo && <Badge variant="outline">Demo record</Badge>}
              </div>
              <CardTitle className="mt-2 text-2xl">{donor.display_name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {donor.locality}, {donor.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Availability</dt>
                  <dd className="font-medium">{availabilityLabel(donor.availability)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last donation</dt>
                  <dd className="font-medium">{donor.last_donation_date ?? "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Emergency contact preference</dt>
                  <dd className="font-medium">
                    {donor.emergency_contact_ok
                      ? "Happy to be called in emergencies"
                      : "Prefers to be contacted with notice"}
                  </dd>
                </div>
              </dl>

              {donor.is_demo && (
                <Alert>
                  <AlertTitle>This is sample data</AlertTitle>
                  <AlertDescription>
                    Demo records exist to show how the registry works. They are not real people and
                    the phone number will not connect to anyone.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">Contact details</p>
                {contact ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="flex items-center gap-2 font-semibold">
                      <Phone className="size-4" aria-hidden="true" />
                      {contact.contact_number}
                    </p>
                    <p className="text-muted-foreground">{contact.full_name}</p>
                    {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hidden by default. {user ? "Reveals are logged." : "Sign in to reveal."}
                    </p>
                    {user ? (
                      <Button
                        className="mt-3"
                        onClick={() => reveal.mutate()}
                        disabled={reveal.isPending}
                      >
                        {reveal.isPending ? "Revealing…" : "Reveal contact"}
                      </Button>
                    ) : (
                      <Button asChild className="mt-3" variant="outline">
                        <Link to="/auth">Sign in to reveal contact</Link>
                      </Button>
                    )}
                  </>
                )}
              </div>

              <Alert variant="destructive">
                <AlertTitle>Confirm compatibility first</AlertTitle>
                <AlertDescription>{MEDICAL_NOTICE}</AlertDescription>
              </Alert>
              <p className="text-xs text-muted-foreground">{EMERGENCY_NOTICE}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" aria-hidden="true" /> Report incorrect data
              </CardTitle>
              <CardDescription>
                Tell an administrator if this record is wrong, outdated or being misused.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wrong contact number">Wrong contact number</SelectItem>
                    <SelectItem value="Wrong blood group">Wrong blood group</SelectItem>
                    <SelectItem value="No longer donating">No longer donating</SelectItem>
                    <SelectItem value="Listed without consent">Listed without consent</SelectItem>
                    <SelectItem value="Misuse or harassment">Misuse or harassment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Details (optional)</Label>
                <Textarea
                  id="details"
                  value={details}
                  maxLength={500}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Anything that helps us check this record"
                />
              </div>
              <Button
                variant="outline"
                disabled={!reason || report.isPending}
                onClick={() => report.mutate()}
              >
                {report.isPending ? "Sending…" : "Submit report"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
