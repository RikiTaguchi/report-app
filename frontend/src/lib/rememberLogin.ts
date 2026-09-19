import type { Role } from "@/lib/types";

const COOKIE_PREFIX = "remember-login-";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface RememberedLogin {
  username: string;
  password: string;
}

function cookieName(role: Role): string {
  return `${COOKIE_PREFIX}${role.toLowerCase()}`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string | null): void {
  if (!value) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

function parseRemembered(raw: string | null): RememberedLogin {
  if (!raw) return { username: "", password: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<RememberedLogin>;
    if (parsed && typeof parsed === "object") {
      return {
        username: typeof parsed.username === "string" ? parsed.username : "",
        password: typeof parsed.password === "string" ? parsed.password : "",
      };
    }
  } catch {
    return { username: raw, password: "" };
  }
  return { username: raw, password: "" };
}

export function getRememberedLogin(role: Role): RememberedLogin {
  if (typeof document === "undefined") return { username: "", password: "" };
  return parseRemembered(readCookie(cookieName(role)));
}

export function setRememberedLogin(role: Role, login: RememberedLogin | null): void {
  if (typeof document === "undefined") return;
  if (!login) {
    writeCookie(cookieName(role), null);
    return;
  }
  writeCookie(cookieName(role), JSON.stringify({
    username: login.username,
    password: login.password,
  }));
}
