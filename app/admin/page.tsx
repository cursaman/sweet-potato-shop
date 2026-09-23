import type { Metadata } from "next";
import AdminClient from "./admin-client";

export const metadata: Metadata = { title: "입금 확인 | 온기담은 관리자" };

export default function AdminPage() {
  return <AdminClient />;
}
