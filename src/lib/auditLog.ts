import fs from "fs";
import path from "path";

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  detail: string;
}

const LOG_FILE = path.join(process.cwd(), "src", "data", "audit-log.json");
const MAX_ENTRIES = 500;

let entries: AuditEntry[] | null = null;

function loadLog(): AuditEntry[] {
  if (entries) return entries;
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }
  return entries!;
}

function saveLog(): void {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries!.slice(0, MAX_ENTRIES), null, 2), "utf-8");
  } catch {}
}

export function logAction(action: string, user: string, detail: string): void {
  const log = loadLog();
  log.unshift({
    timestamp: new Date().toISOString(),
    action,
    user,
    detail,
  });
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  saveLog();
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return loadLog().slice(0, limit);
}
