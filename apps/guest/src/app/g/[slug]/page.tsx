import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { translate } from "@stayflow/i18n/core";
import { GuideView, fetchPublicGuide } from "@stayflow/module-guest";

// Always fresh: a host who edits the guide expects guests to see it right away.
export const dynamic = "force-dynamic";

const t = (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => translate("es", key, vars);

const getGuide = cache(async (slug: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return fetchPublicGuide(client, slug);
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = await getGuide((await params).slug);
  return {
    title: guide ? guide.title || guide.propertyName : t("guide.notFoundTitle"),
    // A guide is private to people who were given the link: never index it, never leak the link to other sites.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function PublicGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = await getGuide((await params).slug);
  if (!guide) notFound();
  return <GuideView guide={guide} t={t} />;
}
