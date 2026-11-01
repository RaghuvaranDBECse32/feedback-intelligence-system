import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: "AI insights are not configured." }, { status: 503 });
  try {
    const body = await req.json();
    const feedback = Array.isArray(body.feedback) ? body.feedback.slice(0, 100) : [];
    if (!feedback.length) return NextResponse.json({ error: "No feedback to analyze." }, { status: 400 });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are a customer experience analyst. Use only supplied feedback. State limitations and do not invent metrics. Return concise executive insights, recurring themes, emerging risks, and 3 prioritized actions." },
          { role: "user", content: JSON.stringify(feedback) }
        ]
      })
    });
    if (!response.ok) return NextResponse.json({ error: "AI provider request failed. Check API key, model, and rate limits." }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ insight: data.choices?.[0]?.message?.content || "No insight returned." });
  } catch {
    return NextResponse.json({ error: "Invalid request or AI provider unavailable." }, { status: 500 });
  }
}
