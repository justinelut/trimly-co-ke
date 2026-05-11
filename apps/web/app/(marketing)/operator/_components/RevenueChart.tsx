/**
 * Inline SVG revenue chart for /operator/payments. No external library
 * dependency — every pixel is under our control, the bundle stays small,
 * and the visual matches the editorial restraint of the rest of the UI.
 *
 * Pure presentational server component. Takes a series of { date, revenueKES }
 * points and renders a smoothed area + line in brass on a 1px grid.
 */
import type { RevenuePoint } from "../_lib/operator-types";

const W = 720;
const H = 220;
const PADDING = { top: 12, right: 16, bottom: 28, left: 56 };

function buildAreaAndLinePaths(series: RevenuePoint[]): { area: string; line: string } {
  if (series.length === 0) return { area: "", line: "" };
  const maxY = Math.max(...series.map((p) => p.revenueKES), 1);
  const stepX = (W - PADDING.left - PADDING.right) / Math.max(series.length - 1, 1);
  const scaleY = (v: number) =>
    PADDING.top + (1 - v / maxY) * (H - PADDING.top - PADDING.bottom);

  const points = series.map((p, i) => ({
    x: PADDING.left + i * stepX,
    y: scaleY(p.revenueKES),
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const baseY = H - PADDING.bottom;
  const first = points[0];
  const last = points[points.length - 1];
  const area = `M${first.x.toFixed(1)},${baseY} ${line.replace(/^M/, "L")} L${last.x.toFixed(1)},${baseY} Z`;
  return { area, line };
}

function buildYAxisTicks(maxY: number): Array<{ value: number; y: number }> {
  const ticks: Array<{ value: number; y: number }> = [];
  // Round maxY up to a clean step (5k / 10k / etc.) for readable labels
  const step = maxY > 50_000 ? 20_000 : maxY > 20_000 ? 10_000 : maxY > 10_000 ? 5_000 : 2_000;
  for (let v = 0; v <= maxY; v += step) {
    const y = PADDING.top + (1 - v / maxY) * (H - PADDING.top - PADDING.bottom);
    ticks.push({ value: v, y });
  }
  return ticks;
}

function buildXAxisTicks(series: RevenuePoint[]): Array<{ label: string; x: number }> {
  const stepX = (W - PADDING.left - PADDING.right) / Math.max(series.length - 1, 1);
  // Show 5 labels evenly spaced across the series.
  const idxs = [0, Math.floor(series.length / 4), Math.floor(series.length / 2), Math.floor((series.length * 3) / 4), series.length - 1];
  return idxs.map((i) => {
    const p = series[i];
    const d = new Date(p.date);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    return { label, x: PADDING.left + i * stepX };
  });
}

export function RevenueChart({ series }: { series: RevenuePoint[] }) {
  if (series.length === 0) {
    return (
      <div className="t-chart" aria-hidden>
        <p style={{ margin: 0, color: "var(--trimly-text-muted)", fontSize: 13 }}>No revenue data yet.</p>
      </div>
    );
  }

  const maxY = Math.max(...series.map((p) => p.revenueKES), 1);
  const yTicks = buildYAxisTicks(maxY);
  const xTicks = buildXAxisTicks(series);
  const { area, line } = buildAreaAndLinePaths(series);
  const last = series[series.length - 1];
  const stepX = (W - PADDING.left - PADDING.right) / Math.max(series.length - 1, 1);
  const lastX = PADDING.left + (series.length - 1) * stepX;
  const lastY = PADDING.top + (1 - last.revenueKES / maxY) * (H - PADDING.top - PADDING.bottom);

  return (
    <div className="t-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Revenue over the last 30 days">
        <g className="t-chart__axis">
          {/* Y grid + labels */}
          {yTicks.map((t) => (
            <g key={`yt-${t.value}`}>
              <line
                className="t-chart__grid"
                x1={PADDING.left}
                x2={W - PADDING.right}
                y1={t.y}
                y2={t.y}
                strokeDasharray={t.value === 0 ? undefined : "1 3"}
              />
              <text x={PADDING.left - 10} y={t.y + 4} textAnchor="end">
                KES {(t.value / 1000).toFixed(0)}k
              </text>
            </g>
          ))}
          {/* X labels */}
          {xTicks.map((t, i) => (
            <text key={`xt-${i}`} x={t.x} y={H - 8} textAnchor="middle">
              {t.label}
            </text>
          ))}
        </g>

        <path className="t-chart__area" d={area} />
        <path className="t-chart__line" d={line} />
        <circle className="t-chart__dot" cx={lastX} cy={lastY} r={3.5} />
      </svg>
    </div>
  );
}
