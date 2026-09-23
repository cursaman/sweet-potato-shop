import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sweet_potato_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && safeEqual(password, expected));
}

export async function createAdminSession() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expires);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function hasAdminSession() {
  const secret = process.env.ADMIN_PASSWORD;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!secret || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature, sign(expires, secret));
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
