import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { availabilityLabel, toCsv } from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Registry administration — Blood Management Registry" },
      {
        name: "description",
        content:
          "Review, verify, deactivate and export donor records, and act on reports of incorrect data.",
      },
      { property: "og:title", content: "Registry administration" },
      {
        property: "og:description",
        content: "Admin tools for keeping the donor registry accurate and safe.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const donorsQuery = useQuery({
    queryKey: ["admin-donors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const eventsQuery = useQuery({
    queryKey: ["admin-report-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const patch = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: { verified?: boolean; active?: boolean };
    }) => {
      const { error } = await supabase.from("donors").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-donors"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const resolveReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("donor_reports").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report marked as reviewed.");
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("bootstrap_admin");
      if (error) throw error;
      return data;
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success("You are now an administrator. Reload to continue.");
        window.location.reload();
      } else {
        toast.error("An administrator already exists. Ask them to grant you access.");
      }
    },
  });

  if (loading) return <Skeleton className="mx-auto mt-10 h-64 max-w-5xl" />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" aria-hidden="true" /> Administrator access required
            </CardTitle>
            <CardDescription>
              This dashboard is limited to registry administrators. If this is a fresh demo
              installation, the first signed-in person can claim the administrator role.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => claimAdmin.mutate()} disabled={claimAdmin.isPending}>
              Claim administrator role
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donors = donorsQuery.data ?? [];
  const term = filter.trim().toLowerCase();
  const filtered = donors.filter((donor) =>
    term
      ? [donor.full_name, donor.city, donor.locality, donor.blood_group]
          .join(" ")
          .toLowerCase()
          .includes(term)
      : true,
  );
  const reports = reportsQuery.data ?? [];

  const exportCsv = () => {
    const csv = toCsv(
      filtered.map((donor) => ({
        full_name: donor.full_name,
        blood_group: donor.blood_group,
        locality: donor.locality,
        city: donor.city,
        contact_number: donor.contact_number,
        email: donor.email ?? "",
        availability: donor.availability,
        last_donation_date: donor.last_donation_date ?? "",
        verified: donor.verified,
        active: donor.active,
        consent_given: donor.consent_given,
        is_demo: donor.is_demo,
      })),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "donor-registry.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Registry administration</h1>
          <p className="mt-2 text-muted-foreground">
            {donors.length} records · {reports.filter((r) => !r.resolved).length} open reports
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 size-4" /> Export CSV
        </Button>
      </div>

      <Tabs defaultValue="records" className="mt-8">
        <TabsList>
          <TabsTrigger value="records">Donor records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6 space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="admin-filter">Filter records</Label>
            <Input
              id="admin-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Name, city, area or blood group"
            />
          </div>

          {donorsQuery.isLoading && <Skeleton className="h-64 w-full" />}

          {!donorsQuery.isLoading && filtered.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No records match this filter.
            </p>
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-medium">
                        {donor.full_name}
                        {donor.is_demo && (
                          <Badge variant="outline" className="ml-2">
                            Demo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{donor.blood_group}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {donor.locality}, {donor.city}
                      </TableCell>
                      <TableCell className="text-sm">{donor.contact_number}</TableCell>
                      <TableCell className="space-x-1 text-xs">
                        <Badge variant={donor.active ? "secondary" : "outline"}>
                          {donor.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{availabilityLabel(donor.availability)}</Badge>
                        {donor.verified && <Badge>Verified</Badge>}
                      </TableCell>
                      <TableCell className="space-x-2 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            patch.mutate({ id: donor.id, values: { verified: !donor.verified } })
                          }
                        >
                          {donor.verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            patch.mutate({ id: donor.id, values: { active: !donor.active } })
                          }
                        >
                          {donor.active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-4">
          {reportsQuery.isLoading && <Skeleton className="h-40 w-full" />}
          {!reportsQuery.isLoading && reports.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No reports yet. Records flagged by the public will appear here.
            </p>
          )}
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="text-base">{report.reason}</CardTitle>
                <CardDescription>
                  {new Date(report.created_at).toLocaleString()} ·{" "}
                  {report.resolved ? "Reviewed" : "Open"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {report.details && <p className="text-muted-foreground">{report.details}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/donors/$id" params={{ id: report.donor_id }}>
                      Open record
                    </Link>
                  </Button>
                  {!report.resolved && (
                    <Button size="sm" onClick={() => resolveReport.mutate(report.id)}>
                      Mark reviewed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
