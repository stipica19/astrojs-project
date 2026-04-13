import { getT } from "@/i18n";
import type { Locale, Translation } from "@/types";

export const LOCALES: Locale[] = ["hr", "en"];

/** Standard getStaticPaths za sve [lang] stranice. */
export function buildStaticPaths() {
  return LOCALES.map((lang) => ({
    params: { lang },
    props: { lang, t: getT(lang) },
  }));
}

/** Izvlaci lang iz props ili params sa fallback na "hr". */
export function resolveLang(
  props: Partial<{ lang: Locale }> | undefined,
  params: Partial<{ lang: string }>,
): Locale {
  return props?.lang ?? (params?.lang as Locale) ?? "hr";
}

/** Izvlaci translation objekt iz props ili ga generira na osnovu langa. */
export function resolveT(
  props: Partial<{ t: Translation }> | undefined,
  lang: Locale,
): Translation {
  return props?.t ?? getT(lang);
}

/** Spaja items sa iconama po indeksu. */
export function withIcons<T extends object>(
  items: T[],
  icons: unknown[],
): (T & { icon: unknown })[] {
  return items.map((item, idx) => ({ ...item, icon: icons[idx] }));
}

/** Dodaje lang prefix na interni href, ignorira vanjske URL-ove. */
export function withLangPrefix(href: string | undefined, lang: Locale): string {
  if (!href) return "#";
  if (/^https?:\/\//.test(href)) return href;
  return href.startsWith(`/${lang}/`)
    ? href
    : `/${lang}${href.startsWith("/") ? href : `/${href}`}`;
}
