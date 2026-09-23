"use client";

export default function PrintButton() {
  return <button type="button" onClick={() => window.print()}>인쇄하기</button>;
}
