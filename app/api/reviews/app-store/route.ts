import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get("country") || "in").toLowerCase();
  const appId = req.nextUrl.searchParams.get("appId") || "";
  if (!/^[a-z]{2}$/.test(country) || !/^\d+$/.test(appId)) {
    return NextResponse.json({ error: "Provide a two-letter country code and numeric App Store app ID." }, { status: 400 });
  }
  try {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`;
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) return NextResponse.json({ error: "Apple RSS returned an error." }, { status: 502 });
    const data = await response.json();
    const entries = data?.feed?.entry || [];
    const reviews = entries.filter((e: any) => e?.content?.label).map((e: any) => ({
      id: e.id?.label, text: e.content.label, rating: Number(e["im:rating"]?.label || 3),
      date: e.updated?.label
    }));
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Unable to fetch Apple App Store RSS at this time." }, { status: 502 });
  }
}
