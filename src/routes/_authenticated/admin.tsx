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
import { useT } from "@/lib/i18n";
import {
  availabilityLabel,
  REPORT_STATUSES,
  reportStatusLabel,
  toCsv,
  type ReportStatus,
} from "@/lib/registry";

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
  const t = useT();
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

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
      toast.success(t("Record updated."));
      void queryClient.invalidateQueries({ queryKey: ["admin-donors"] });
    },
    onError: () => toast.error(t("Update failed.")),
  });

  const review = useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string;
      status: ReportStatus;
      note: string;
    }) => {
      const { error } = await supabase.rpc("review_report", {
        p_report_id: id,
        p_status: status,
        p_note: note,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(`${t("Report moved to")} “${t(reportStatusLabel(variables.status))}”.`);
      setNotes((prev) => ({ ...prev, [variables.id]: "" }));
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-report-events"] });
    },
    onError: () => toast.error(t("Could not update this report.")),
  });

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("bootstrap_admin");
      if (error) throw error;
      return data;
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success(t("You are now an administrator. Reload to continue."));
        window.location.reload();
      } else {
        toast.error(t("An administrator already exists. Ask them to grant you access."));
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
              <ShieldCheck className="size-5" aria-hidden="true" /> {t("Administrator access required")}
            </CardTitle>
            <CardDescription>
              {t(
                "This dashboard is limited to registry administrators. If this is a fresh demo installation, the first signed-in person can claim the administrator role.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => claimAdmin.mutate()} disabled={claimAdmin.isPending}>
              {t("Claim administrator role")}
            </Button>
            <Button asChild variant="outline">
              <Link to="/">{t("Back to search")}</Link>
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
  const events = eventsQuery.data ?? [];
  const visibleReports =
    statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

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
          <h1 className="text-3xl font-semibold">{t("Registry administration")}</h1>
          <p className="mt-2 text-muted-foreground">
            {donors.length} {t("records")} ·{" "}
            {reports.filter((r) => r.status === "open" || r.status === "in_review").length}{" "}
            {t("reports awaiting review")}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 size-4" /> {t("Export CSV")}
        </Button>
      </div>

      <Tabs defaultValue="records" className="mt-8">
        <TabsList>
          <TabsTrigger value="records">{t("Donor records")}</TabsTrigger>
          <TabsTrigger value="reports">{t("Reports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6 space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="admin-filter">{t("Filter records")}</Label>
            <Input
              id="admin-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("Name, city, area or blood group")}
            />
          </div>

          {donorsQuery.isLoading && <Skeleton className="h-64 w-full" />}

          {!donorsQuery.isLoading && filtered.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("No records match this filter.")}
            </p>
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Donor")}</TableHead>
                    <TableHead>{t("Group")}</TableHead>
                    <TableHead>{t("Area")}</TableHead>
                    <TableHead>{t("Contact")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-medium">
                        {donor.full_name}
                        {donor.is_demo && (
                          <Badge variant="outline" className="ml-2">
                            {t("Demo")}
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
                          {donor.active ? t("Active") : t("Inactive")}
                        </Badge>
                        <Badge variant="outline">{t(availabilityLabel(donor.availability))}</Badge>
                        {donor.verified && <Badge>{t("Verified")}</Badge>}
                      </TableCell>
                      <TableCell className="space-x-2 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            patch.mutate({ id: donor.id, values: { verified: !donor.verified } })
                          }
                        >
                          {donor.verified ? t("Unverify") : t("Verify")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            patch.mutate({ id: donor.id, values: { active: !donor.active } })
                          }
                        >
                          {donor.active ? t("Deactivate") : t("Reactivate")}
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
          <div className="flex flex-wrap gap-2">
            {(["all", ...REPORT_STATUSES.map((s) => s.value)] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={statusFilter === value ? "default" : "outline"}
                onClick={() => setStatusFilter(value)}
              >
                {value === "all" ? t("All") : t(reportStatusLabel(value))}
                <span className="ml-2 text-xs opacity-70">
                  {value === "all"
                    ? reports.length
                    : reports.filter((r) => r.status === value).length}
                </span>
              </Button>
            ))}
          </div>

          {reportsQuery.isLoading && <Skeleton className="h-40 w-full" />}
          {!reportsQuery.isLoading && visibleReports.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("No reports in this queue. Records flagged by the public will appear here.")}
            </p>
          )}
          {visibleReports.map((report) => {
            const history = events.filter((e) => e.report_id === report.id);
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{report.reason}</CardTitle>
                    <Badge variant={report.status === "open" ? "default" : "outline"}>
                      {t(reportStatusLabel(report.status))}
                    </Badge>
                  </div>
                  <CardDescription>
                    {t("Reported")} {new Date(report.created_at).toLocaleString()}
                    {report.reviewed_at
                      ? ` · ${t("last reviewed")} ${new Date(report.reviewed_at).toLocaleString()}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {report.details && <p className="text-muted-foreground">{report.details}</p>}
                  {report.admin_notes && (
                    <p className="rounded-md bg-muted p-3 text-muted-foreground">
                      {t("Latest note:")} {report.admin_notes}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`note-${report.id}`}>{t("Review note (optional)")}</Label>
                      <Textarea
                        id={`note-${report.id}`}
                        rows={2}
                        value={notes[report.id] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        placeholder={t("What did you check or change?")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`status-${report.id}`}>{t("Set status")}</Label>
                      <Select
                        value={report.status}
                        onValueChange={(status) =>
                          review.mutate({
                            id: report.id,
                            status: status as ReportStatus,
                            note: notes[report.id] ?? "",
                          })
                        }
                      >
                        <SelectTrigger id={`status-${report.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REPORT_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {t(s.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/donors/$id" params={{ id: report.donor_id }}>
                        {t("Open record")}
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {t("Status history")}
                    </h3>
                    <ol className="space-y-2 border-l border-border pl-4">
                      {history.length === 0 && (
                        <li className="text-muted-foreground">{t("No changes recorded yet.")}</li>
                      )}
                      {history.map((event) => (
                        <li key={event.id} className="text-sm">
                          <span className="font-medium">
                            {event.from_status
                              ? `${t(reportStatusLabel(event.from_status))} → ${t(reportStatusLabel(event.to_status))}`
                              : t(reportStatusLabel(event.to_status))}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {new Date(event.created_at).toLocaleString()}
                          </span>
                          {event.note && <p className="text-muted-foreground">{event.note}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
