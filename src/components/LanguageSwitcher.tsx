import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className={className}>
      <label htmlFor="language-select" className="sr-only">
        {t("Language")}
      </label>
      <Select value={lang} onValueChange={(value) => setLang(value as Lang)}>
        <SelectTrigger
          id="language-select"
          className="h-9 w-auto gap-2"
          aria-label={t("Language")}
        >
          <Languages className="size-4 shrink-0" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LANGUAGES.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
