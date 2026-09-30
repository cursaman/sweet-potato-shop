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
  description: "경주 산내의 실제 재배 현장을 보여주고, 직접 키운 고구마를 한 상자씩 선별해 보내는 산지 직송 판매 페이지입니다.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${bodyFont.variable} ${displayFont.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
