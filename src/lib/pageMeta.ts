import "server-only";
import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";

/**
 * Title and Google description for a main page, as saved in the SEO dashboard
 * (falling back to the wording shipped in the content registry).
 */
export async function pageMetadata(
  page: string,
  canonical: string,
  options: { absoluteTitle?: boolean } = {}
): Promise<Metadata> {
  const content = await getSiteContent();
  const title = content(`seo.page.${page}.title`);
  const description = content(`seo.page.${page}.description`);
  return {
    title: options.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
  };
}
