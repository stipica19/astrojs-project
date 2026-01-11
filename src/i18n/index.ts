import en from "./en.json";
import hr from "./hr.json";

export type Locale = "en" | "hr";

const dictionaries = { en, hr };

export function getT(locale: Locale) {
    return dictionaries[locale] ?? dictionaries.hr;
}