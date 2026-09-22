import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "산내 온기담은 고구마",
  description: "경주 산내에서 직접 재배해 정성껏 포장하는 산지 직송 고구마입니다.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
