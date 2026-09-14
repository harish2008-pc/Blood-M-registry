import * as shared from "./dict-shared";
import * as publicPages from "./dict-public";
import * as account from "./dict-account";
import * as forms from "./dict-forms";

export const dictionaries: Record<"hi" | "ta", Record<string, string>> = {
  hi: { ...shared.hi, ...publicPages.hi, ...account.hi, ...forms.hi },
  ta: { ...shared.ta, ...publicPages.ta, ...account.ta, ...forms.ta },
};
