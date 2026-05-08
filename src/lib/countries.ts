export type UiLocale = "pt-BR" | "en" | "es" | "fr" | "ja" | "pt-PT";
import worldCountries from "world-countries";

export function flagEmojiFromAlpha2(alpha2: string) {
  const code = alpha2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  const first = A + (code.charCodeAt(0) - base);
  const second = A + (code.charCodeAt(1) - base);
  return String.fromCodePoint(first, second);
}

function toDisplayLocale(locale: UiLocale) {
  return locale === "en" ? "en" : locale;
}

export type SovereignCountry = {
  alpha2: string;
  name: string;
  flag: string;
};

/**
 * Returns a clean list of sovereign countries (independent + UN member),
 * localized by UI locale when possible.
 */
export function getAllCountries(locale: UiLocale): SovereignCountry[] {
  const displayNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([toDisplayLocale(locale)], { type: "region" })
      : null;

  type WorldCountry = {
    independent?: boolean;
    unMember?: boolean;
    cca2?: string;
    name?: { common?: string; official?: string };
  };

  const list = (worldCountries as WorldCountry[])
    .filter((c) => c?.independent === true && c?.unMember === true && !!c?.cca2)
    .map((c) => {
      const alpha2 = String(c.cca2).toUpperCase();
      const localized =
        displayNames?.of(alpha2) ?? c?.name?.common ?? c?.name?.official ?? alpha2;

      return {
        alpha2,
        name: String(localized),
        flag: flagEmojiFromAlpha2(alpha2),
      } satisfies SovereignCountry;
    });

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

