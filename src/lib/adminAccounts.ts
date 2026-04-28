import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export type AdminRole = "viewer" | "editor" | "admin";

export interface AdminAccount {
  username: string;
  passwordHash: string;
  role: AdminRole;
  displayName: string;
}

const DATA_FILE = path.join(process.cwd(), "src", "data", "admins.json");

function getDefaultAdmins(): AdminAccount[] {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (username && passwordHash) {
    return [{ username, passwordHash, role: "admin", displayName: "Admin" }];
  }
  if (process.env.NODE_ENV === "production") {
    console.error("\x1b[31mSECURITY WARNING: Admin credentials not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH env vars.\x1b[0m");
  } else {
    console.warn("\x1b[33mWARNING: Using default dev admin (admin/admin123). Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH env vars.\x1b[0m");
  }
  // Generate a random admin password for unconfigured environments
  const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return [
    {
      username: "admin",
      passwordHash: bcrypt.hashSync(randomPassword, 10),
      role: "admin",
      displayName: "Admin",
    },
  ];
}

let cache: AdminAccount[] | null = null;

export function getAdmins(): AdminAccount[] {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = getDefaultAdmins();
  }
  return cache!;
}

function saveAdmins(admins: AdminAccount[]): void {
  cache = admins;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(admins, null, 2), "utf-8");
  } catch {}
}

export async function findAdmin(username: string, password: string): Promise<AdminAccount | null> {
  const admins = getAdmins();
  const account = admins.find((a) => a.username === username);
  if (!account) return null;
  const match = await bcrypt.compare(password, account.passwordHash);
  return match ? account : null;
}

export async function addAdmin(
  username: string,
  password: string,
  role: AdminRole,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const admins = getAdmins();
  if (admins.find((a) => a.username === username)) {
    return { success: false, error: "Username already exists" };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  const hash = await bcrypt.hash(password, 10);
  admins.push({ username, passwordHash: hash, role, displayName });
  saveAdmins(admins);
  return { success: true };
}

export function removeAdmin(username: string): { success: boolean } {
  const admins = getAdmins();
  const idx = admins.findIndex((a) => a.username === username);
  if (idx === -1) return { success: false };
  // Don't delete last admin
  if (admins.length <= 1) return { success: false };
  admins.splice(idx, 1);
  saveAdmins(admins);
  return { success: true };
}

export function updateAdminRole(
  username: string,
  role: AdminRole
): { success: boolean } {
  const admins = getAdmins();
  const account = admins.find((a) => a.username === username);
  if (!account) return { success: false };
  account.role = role;
  saveAdmins(admins);
  return { success: true };
}

export function hasPermission(role: AdminRole, action: "view" | "edit" | "admin"): boolean {
  if (action === "view") return true;
  if (action === "edit") return role === "editor" || role === "admin";
  if (action === "admin") return role === "admin";
  return false;
}
