export type { Locale, Translation } from "@/i18n";

export interface NavbarLabels {
  brand: string;
  service: string;
  product: string;
  about: string;
  contact: string;
  webLab: string;
  openSourceIntegrator: string;
}

export interface FeatureItem {
  title: string;
  desc: string;
  href?: string;
  icon?: unknown;
}
