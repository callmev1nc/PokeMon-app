import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import TCGdex from "@tcgdex/sdk";

const tcgdex = new TCGdex("en");
tcgdex.setCacheTTL(3600);

const SET_MAP: Record<string, string> = {
  SVI: "sv01",
  PAL: "sv02",
  OBF: "sv03",
  MEW: "sv03.5",
  PAR: "sv04",
  PAF: "sv04.5",
  PEL: "sv04.5",
  TEF: "sv05",
  TWM: "sv06",
  SFA: "sv06.5",
  SCR: "sv07",
  SSP: "sv08",
  PRE: "sv08.5",
  JTG: "sv09",
  DRI: "sv10",
  BLK: "sv10.5b",
  WHT: "sv10.5w",
  MEG: "me01",
  PFL: "me02",
  FPL: "me02",
  ASC: "me02.5",
  POR: "me03",
  SVE: "sve",
  SVP: "svp",
};

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/['']/g, "")
    .replace(/[^A-Z0-9\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

// POST /api/validate — validate a single card against tcgdex.dev
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, series } = body;
    if (!name) {
      return NextResponse.json({ error: "Card name required" }, { status: 400 });
    }

    let cardNumber = "";
    let setCode = "";
    if (series) {
      const match = String(series).match(/^(.+?)\s+(\d+)/i);
      if (match) {
        setCode = match[1].trim().toUpperCase().replace(/\s+(EN|GG|TG)$/i, "");
        cardNumber = match[2];
      }
    }

    // Try set-based lookup first
    let bestMatch = null;
    const setId = SET_MAP[setCode];

    if (setId) {
      const set = await tcgdex.set.get(setId);
      if (set?.cards) {
        // Match by card number
        if (cardNumber) {
          const padded = cardNumber.padStart(3, "0");
          bestMatch = set.cards.find(
            (c) => c.localId === cardNumber || c.localId === padded
          );
        }
        // Fallback: match by name
        if (!bestMatch) {
          const norm = normalizeName(name);
          bestMatch = set.cards.find((c) => normalizeName(c.name) === norm);
          if (!bestMatch) {
            bestMatch = set.cards.find((c) => {
              const cn = normalizeName(c.name);
              return cn.includes(norm) || norm.includes(cn);
            });
          }
        }
      }
    }

    if (!bestMatch) {
      return NextResponse.json({
        found: false,
        name,
        series,
        reason: "No matching card found in tcgdex.dev database",
      });
    }

    return NextResponse.json({
      found: true,
      card: {
        id: bestMatch.id,
        name: bestMatch.name,
        localId: bestMatch.localId,
        image: bestMatch.image,
        imageHighWebp: bestMatch.getImageURL?.("high", "webp"),
        imageHighPng: bestMatch.getImageURL?.("high", "png"),
      },
      nameMatch: normalizeName(name) === normalizeName(bestMatch.name),
      numberMatch: cardNumber ? cardNumber === bestMatch.localId : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Validation request failed" },
      { status: 500 }
    );
  }
}
