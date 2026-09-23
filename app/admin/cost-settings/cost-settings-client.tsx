"use client";

import { useState, useTransition } from "react";
import { type CostSetting } from "@/lib/cost-settings";
import { updateCostSetting } from "./actions";
import styles from "./cost-settings.module.css";

type Draft = { crop: string; box: string; shipping: string };
const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function CostSettingsClient({ initialSettings, initiallySaved }: { initialSettings: CostSetting[]; initiallySaved: boolean }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(initiallySaved);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(Object.fromEntries(initialSettings.map((item) => [item.product_weight, { crop: String(item.crop_cost), box: String(item.box_cost), shipping: String(item.shipping_cost) }])));
  const [message, setMessage] = useState(initiallySaved ? "" : "현재 임시 기준값입니다. SQL 마이그레이션을 적용한 뒤 저장할 수 있습니다.");
  const [isPending, startTransition] = useTransition();

  function change(weight: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({ ...current, [weight]: { ...current[weight], [field]: value } }));
  }

  function save(weight: string) {
    const draft = drafts[weight];
    setMessage("");
    startTransition(async () => {
      const response = await updateCostSetting(weight, Number(draft.crop), Number(draft.box), Number(draft.shipping));
      if (!response.ok) return setMessage(response.message);
      setSettings((current) => current.map((item) => item.product_weight === weight ? response.data : item));
      setSaved(true);
      setMessage(`${weight} 비용 기준을 저장했습니다.`);
    });
  }

  return <>
    <p className={saved ? styles.saved : styles.warning}>{saved ? "데이터베이스에 저장된 비용 기준입니다." : "임시 기준값 사용 중"}</p>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
    <section className={styles.grid} aria-label="중량별 비용 설정">
      {settings.map((item) => { const draft = drafts[item.product_weight]; const total = Number(draft.crop || 0) + Number(draft.box || 0) + Number(draft.shipping || 0); return <article key={item.product_weight}><h2>{item.product_weight}</h2><label>고구마 원가<input type="number" min="0" max="1000000" step="100" value={draft.crop} onChange={(event) => change(item.product_weight, "crop", event.target.value)} /></label><label>박스비<input type="number" min="0" max="1000000" step="100" value={draft.box} onChange={(event) => change(item.product_weight, "box", event.target.value)} /></label><label>배송비<input type="number" min="0" max="1000000" step="100" value={draft.shipping} onChange={(event) => change(item.product_weight, "shipping", event.target.value)} /></label><div><span>목표 총비용</span><strong>{formatPrice(total)}</strong></div><button type="button" onClick={() => save(item.product_weight)} disabled={isPending}>저장</button></article>; })}
    </section>
  </>;
}
