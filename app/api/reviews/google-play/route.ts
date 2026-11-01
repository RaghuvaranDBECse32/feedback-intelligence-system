import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get("appId") || "";
  const count = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("count") || 50)));
  if (!/^[A-Za-z0-9_.]+$/.test(appId)) {
    return NextResponse.json({ error: "Invalid Google Play package ID." }, { status: 400 });
  }
  try {
    const mod = await import("google-play-scraper").catch(() => null);
    if (!mod) {
      return NextResponse.json({ error: "Google Play connector is not installed. Use CSV import or add a supported review API." }, { status: 503 });
    }
    const scraper: any = (mod as any).default || mod;
    const result = await scraper.reviews({ appId, sort: scraper.sort?.NEWEST, num: count });
    return NextResponse.json({ reviews: (result.data || []).map((r: any) => ({
      id: r.id, text: r.text, score: r.score, date: r.date
    })) });
  } catch (error) {
    return NextResponse.json({ error: "Google Play could not be reached. Check the package ID, network, or upstream rate limits." }, { status: 502 });
  }
}
