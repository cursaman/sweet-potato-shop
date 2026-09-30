import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: "variable",
  display: "swap",
  preload: false,
  fallback: ["Malgun Gothic", "Apple SD Gothic Neo", "sans-serif"],
});

const displayFont = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: "variable",
  display: "swap",
  preload: false,
  fallback: ["Batang", "AppleMyungjo", "serif"],
});

export const metadata: Metadata = {
  title: "산내 온기담은 고구마",
  description: "경주 산내에서 직접 재배해 정성껏 포장하는 산지 직송 고구마입니다.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
