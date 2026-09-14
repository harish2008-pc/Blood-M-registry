import { z } from "zod";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const AVAILABILITY = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Temporarily unavailable" },
] as const;

export type Availability = "available" | "unavailable";

export const availabilityLabel = (value: string) =>
  AVAILABILITY.find((a) => a.value === value)?.label ?? value;

export type DonorSearchResult = {
  id: string;
  display_name: string;
  locality: string;
  city: string;
  blood_group: BloodGroup;
  availability: Availability;
  verified: boolean;
  is_demo: boolean;
  last_donation_date: string | null;
};

export const REPORT_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "action_taken", label: "Action taken" },
  { value: "dismissed", label: "Dismissed" },
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number]["value"];

export const reportStatusLabel = (value: string) =>
  REPORT_STATUSES.find((s) => s.value === value)?.label ?? value;

export const donorSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter the full name").max(100),
  locality: z.string().trim().min(2, "Please enter an area or locality").max(120),
  city: z.string().trim().min(2, "Please enter a city").max(80),
  contact_number: z
    .string()
    .trim()
    .min(7, "Please enter a reachable phone number")
    .max(20, "Phone number is too long")
    .regex(/^[0-9+\-() ]+$/, "Use digits, spaces, +, - or brackets only"),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  blood_group: z.enum(BLOOD_GROUPS, { message: "Select a blood group" }),
  availability: z.enum(["available", "unavailable"]),
  last_donation_date: z.string().optional().or(z.literal("")),
  emergency_contact_ok: z.boolean(),
  consent_given: z.literal(true, { message: "Consent is required to join the registry" }),
});

export type DonorFormValues = z.infer<typeof donorSchema>;

export const MEDICAL_NOTICE =
  "Matches are based on the blood group people registered themselves. Always confirm compatibility, eligibility and screening with a qualified medical professional or a licensed blood bank before any transfusion.";

export const EMERGENCY_NOTICE =
  "In a medical emergency, contact your local emergency number and the nearest hospital or blood bank first. This registry is a volunteer directory, not an emergency service.";

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}
