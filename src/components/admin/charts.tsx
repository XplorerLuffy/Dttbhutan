/**
 * Small SVG charts for the admin overview. Pure markup, no chart library:
 * they render on the server, ship no JavaScript, and stay sharp at any size.
 */

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 120;
  const h = 36;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const id = `sp-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A tidy axis maximum: 4 → 4, 7 → 8, 13 → 15, 42 → 45. */
function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = n <= 10 ? 2 : n <= 30 ? 5 : n <= 100 ? 10 : 50;
  return Math.ceil(n / step) * step;
}

export function AreaChart({
  labels,
  values,
  color = "#0a8f5b",
  unit = "bookings",
}: {
  labels: string[];
  values: number[];
  color?: string;
  unit?: string;
}) {
  const W = 420;
  const H = 230;
  const pad = { l: 34, r: 12, t: 14, b: 28 };
  const max = niceMax(Math.max(...values, 0));
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const step = values.length > 1 ? iw / (values.length - 1) : iw;
  const x = (i: number) => pad.l + i * step;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const every = Math.max(1, Math.round(values.length / 6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${unit} per day`}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="#78716c">
            {t}
          </text>
        </g>
      ))}
      <path d={`${line} L${x(values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) =>
        v > 0 ? (
          <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${labels[i]}: ${v} ${unit}`}</title>
          </circle>
        ) : null
      )}
      {labels.map((l, i) =>
        i % every === 0 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#78716c">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

export function Donut({
  slices,
  total,
  centerLabel,
}: {
  slices: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-44 w-44 shrink-0" role="img" aria-label={centerLabel}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#f1efec" strokeWidth="18" />
      {total > 0 &&
        slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${c}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
      <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1c1917">
        {total}
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#78716c">
        {centerLabel}
      </text>
    </svg>
  );
}
