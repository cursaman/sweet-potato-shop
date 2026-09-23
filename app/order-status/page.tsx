import type { Metadata } from "next";
import OrderStatusClient from "./order-status-client";

export const metadata: Metadata = { title: "주문 조회 | 온기담은 고구마" };

export default function OrderStatusPage() {
  return <OrderStatusClient />;
}
