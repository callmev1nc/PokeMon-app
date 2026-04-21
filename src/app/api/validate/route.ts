import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const TCG_API_BASE = "https://api.pokemontcg.io/v2";

// GET /api/validate — serve the pre-built validation report
export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "data", "validation-report.json");
    const data = readFileSync(filePath, "utf-8");
    const report = JSON.parse(data);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Validation report not found. Run `npm run validate-cards` first." },
      { status: 404 }
    );
  }
}

// POST /api/validate — validate a single card against TCG API on demand
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, series } = body;
    if (!name) {
      return NextResponse.json({ error: "Card name required" }, { status: 400 });
    }

    let cardNumber = "";
    if (series) {
      const match = String(series).match(/^(.+?)\s+(\d+)\//i);
      if (match) {
        cardNumber = match[2];
      }
    }

    // Search TCG API by name
    const searchRes = await fetch(
      `${TCG_API_BASE}/cards?q=${encodeURIComponent(`name:"${name}"`)}&pageSize=10`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: `TCG API error: ${searchRes.status}` },
        { status: 502 }
      );
    }

    const searchData = await searchRes.json();
    const cards: any[] = searchData.data || [];

    if (cards.length === 0) {
      const broadRes = await fetch(
        `${TCG_API_BASE}/cards?q=${encodeURIComponent(`name:${name}`)}&pageSize=10`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (broadRes.ok) {
        const broadData = await broadRes.json();
        cards.push(...(broadData.data || []));
      }
    }

    let bestMatch = null;
    if (cardNumber) {
      bestMatch = cards.find((c) => c.number === cardNumber);
    }
    if (!bestMatch && cards.length > 0) {
      bestMatch = cards[0];
    }

    if (!bestMatch) {
      return NextResponse.json({
        found: false,
        name,
        series,
        reason: "No matching card found in Pokémon TCG database",
      });
    }

    return NextResponse.json({
      found: true,
      card: {
        id: bestMatch.id,
        name: bestMatch.name,
        number: bestMatch.number,
        supertype: bestMatch.supertype,
        subtypes: bestMatch.subtypes,
        types: bestMatch.types || [],
        hp: bestMatch.hp,
        rarity: bestMatch.rarity,
        flavorText: bestMatch.flavorText,
        setName: bestMatch.set?.name,
        setId: bestMatch.set?.id,
        setSeries: bestMatch.set?.series,
        imageSmall: bestMatch.images?.small,
        imageLarge: bestMatch.images?.large,
      },
      nameMatch: normalizeName(name) === normalizeName(bestMatch.name),
      numberMatch: cardNumber ? cardNumber === bestMatch.number : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Validation request failed" },
      { status: 500 }
    );
  }
}

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/['']/g, "")
    .replace(/[^A-Z0-9\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
