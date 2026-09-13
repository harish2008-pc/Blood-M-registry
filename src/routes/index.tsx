import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Droplet, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  AVAILABILITY,
  BLOOD_GROUPS,
  availabilityLabel,
  EMERGENCY_NOTICE,
  MEDICAL_NOTICE,
  type DonorSearchResult,
} from "@/lib/registry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find a blood donor near you — Blood Management Registry" },
      {
        name: "description",
        content:
          "Search a consent-based registry of volunteer blood donors by blood group, area and availability. Contact details stay private until deliberately revealed.",
      },
      { property: "og:title", content: "Find a blood donor near you" },
      {
        property: "og:description",
        content:
          "A calm, privacy-first directory of volunteer blood donors, searchable by blood group and locality.",
      },
    ],
  }),
  component: Index,
});

const ANY = "any";

function Index() {
  const [bloodGroup, setBloodGroup] = useState<string>(ANY);
  const [availability, setAvailability] = useState<string>(ANY);
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [nearArea, setNearArea] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [query, setQuery] = useState({
    blood_group: "",
    locality: "",
    city: "",
    availability: "",
  });

  const results = useQuery({
    queryKey: ["donor-search", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_donors", {
        p_blood_group: query.blood_group,
        p_locality: query.locality,
        p_city: query.city,
        p_availability: query.availability,
      });
      if (error) throw error;
      return (data ?? []) as DonorSearchResult[];
    },
    enabled: submitted,
  });

  const sorted = useMemo(() => {
    const rows = [...(results.data ?? [])];
    const near = nearArea.trim().toLowerCase();
    const closeness = (row: DonorSearchResult) => {
      if (!near) return 2;
      const text = `${row.locality} ${row.city}`.toLowerCase();
      if (row.locality.toLowerCase().includes(near)) return 0;
      if (text.includes(near)) return 1;
      return 3;
    };
    return rows.sort((a, b) => {
      const availDiff =
        Number(b.availability === "available") - Number(a.availability === "available");
      if (availDiff !== 0) return availDiff;
      const closeDiff = closeness(a) - closeness(b);
      if (closeDiff !== 0) return closeDiff;
      return Number(b.verified) - Number(a.verified);
    });
  }, [results.data, nearArea]);

  const runSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setQuery({
      blood_group: bloodGroup === ANY ? "" : bloodGroup,
      availability: availability === ANY ? "" : availability,
      locality: locality.trim(),
      city: city.trim(),
    });
    setSubmitted(true);
  };

  return (
    <div>
      <section className="emergency-panel">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Badge variant="secondary" className="mb-4">
            Consent-based volunteer registry
          </Badge>
          <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
            Find a blood donor, fast — without exposing anyone&apos;s privacy
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-90 sm:text-base">
            Search volunteers by blood group and area. Names are shortened and phone numbers stay
            hidden until a signed-in user deliberately asks for them.
          </p>

          <Card className="mt-8 panel-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="size-5" aria-hidden="true" /> Find a donor
              </CardTitle>
              <CardDescription>
                Fill in what you know. Every field is optional except your own urgency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={runSearch} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search-group">Blood group</Label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
                    <SelectTrigger id="search-group">
                      <SelectValue placeholder="Any blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any blood group</SelectItem>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-locality">Area / locality</Label>
                  <Input
                    id="search-locality"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Adyar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-city">City</Label>
                  <Input
                    id="search-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chennai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-availability">Availability</Label>
                  <Select value={availability} onValueChange={setAvailability}>
                    <SelectTrigger id="search-availability">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any status</SelectItem>
                      {AVAILABILITY.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-near">Your area (optional)</Label>
                  <Input
                    id="search-near"
                    value={nearArea}
                    onChange={(e) => setNearArea(e.target.value)}
                    placeholder="Used to sort closest first"
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full" size="lg">
                    Search the registry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Alert variant="destructive">
          <AlertTitle>Confirm compatibility with a professional</AlertTitle>
          <AlertDescription>{MEDICAL_NOTICE}</AlertDescription>
        </Alert>

        <div aria-live="polite" className="mt-8">
          {!submitted && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Droplet className="mx-auto size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold">Start a search above</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Choose a blood group, or simply type a city, to see which volunteers are currently
                available.
              </p>
            </div>
          )}

          {submitted && results.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-40 w-full" />
              ))}
            </div>
          )}

          {submitted && results.isError && (
            <p role="alert" className="text-sm text-destructive">
              The search could not be completed. Please try again.
            </p>
          )}

          {submitted && !results.isLoading && sorted.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <h2 className="text-lg font-semibold">No matching donors yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Try widening the area, removing the availability filter, or searching a nearby city.
                Contact your nearest blood bank in parallel.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/register">Register as a donor</Link>
              </Button>
            </div>
          )}

          {sorted.length > 0 && (
            <>
              <h2 className="mb-4 text-lg font-semibold">
                {sorted.length} matching {sorted.length === 1 ? "donor" : "donors"}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((donor) => (
                  <li key={donor.id}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="text-base">{donor.blood_group}</Badge>
                          <Badge
                            variant={donor.availability === "available" ? "secondary" : "outline"}
                          >
                            {availabilityLabel(donor.availability)}
                          </Badge>
                          {donor.verified && (
                            <Badge variant="secondary">
                              <BadgeCheck className="mr-1 size-3.5" /> Verified
                            </Badge>
                          )}
                          {donor.is_demo && <Badge variant="outline">Demo</Badge>}
                        </div>
                        <CardTitle className="mt-2 text-lg">{donor.display_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="size-4" aria-hidden="true" />
                          {donor.locality}, {donor.city}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/donors/$id" params={{ id: donor.id }}>
                            View record
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-6 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Privacy by default",
            body: "Search results never include phone numbers, emails or street addresses.",
          },
          {
            icon: Users,
            title: "Consent you control",
            body: "Donors opt in, edit their own record, and can withdraw at any moment.",
          },
          {
            icon: Droplet,
            title: "Built for urgency",
            body: "Available and verified volunteers are shown first, closest area next.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Alert>
          <AlertTitle>Emergency guidance</AlertTitle>
          <AlertDescription>{EMERGENCY_NOTICE}</AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
