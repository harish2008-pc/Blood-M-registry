import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUPS, AVAILABILITY, availabilityLabel, donorSchema, type DonorFormValues } from "@/lib/registry";
import { useT } from "@/lib/i18n";

type Props = {
  defaultValues?: Partial<DonorFormValues>;
  submitLabel: string;
  onSubmit: (values: DonorFormValues) => Promise<void> | void;
  pending?: boolean;
};

export function DonorForm({ defaultValues, submitLabel, onSubmit, pending }: Props) {
  const t = useT();
  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      full_name: "",
      locality: "",
      city: "",
      contact_number: "",
      email: "",
      availability: "available",
      last_donation_date: "",
      emergency_contact_ok: false,
      consent_given: undefined as unknown as true,
      ...defaultValues,
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const errors = formState.errors;
  const err = (name: keyof DonorFormValues) =>
    errors[name] ? (
      <p role="alert" className="text-sm text-destructive">
        {t(String(errors[name]?.message))}
      </p>
    ) : null;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">{t("Full name")}</Label>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
          {err("full_name")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locality">{t("Area / locality")}</Label>
          <Input id="locality" placeholder={t("e.g. Indiranagar")} {...register("locality")} />
          {err("locality")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t("City")}</Label>
          <Input id="city" placeholder={t("e.g. Bengaluru")} {...register("city")} />
          {err("city")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_number">{t("Contact number")}</Label>
          <Input
            id="contact_number"
            inputMode="tel"
            autoComplete="tel"
            {...register("contact_number")}
          />
          <p className="text-xs text-muted-foreground">
            {t(
              "Never shown in search results. Only revealed when a signed-in user asks, and each request is logged.",
            )}
          </p>
          {err("contact_number")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("Email (optional)")}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {err("email")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="blood_group">{t("Blood group")}</Label>
          <Select
            value={watch("blood_group")}
            onValueChange={(value) =>
              setValue("blood_group", value as DonorFormValues["blood_group"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="blood_group">
              <SelectValue placeholder={t("Select blood group")} />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("blood_group")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">{t("Availability")}</Label>
          <Select
            value={watch("availability")}
            onValueChange={(value) =>
              setValue("availability", value as DonorFormValues["availability"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="availability">
              <SelectValue placeholder={t("Select availability")} />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(availabilityLabel(option.value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("availability")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_donation_date">{t("Last donation date (optional)")}</Label>
          <Input id="last_donation_date" type="date" {...register("last_donation_date")} />
          {err("last_donation_date")}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="emergency_contact_ok"
            checked={watch("emergency_contact_ok")}
            onCheckedChange={(checked) => setValue("emergency_contact_ok", checked === true)}
          />
          <Label htmlFor="emergency_contact_ok" className="text-sm leading-snug font-normal">
            {t("I am happy to be contacted at short notice in an emergency.")}
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consent_given"
            checked={watch("consent_given") === true}
            onCheckedChange={(checked) =>
              setValue("consent_given", (checked === true) as true, { shouldValidate: true })
            }
          />
          <Label htmlFor="consent_given" className="text-sm leading-snug font-normal">
            {t(
              "I consent to my shortened name, blood group, area, city and availability being listed publicly, and to my contact number being released to signed-in users who request it. I can withdraw this consent at any time.",
            )}
          </Label>
        </div>
        {err("consent_given")}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t("Saving…") : submitLabel}
      </Button>
    </form>
  );
}
