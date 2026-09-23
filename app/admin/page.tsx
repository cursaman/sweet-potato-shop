import type { Metadata } from "next";
import AdminClient from "./admin-client";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = { title: "입금 확인 | 온기담은 관리자" };

export default async function AdminPage() {
  return <AdminClient initiallyAuthenticated={await hasAdminSession()} />;
}
