/**
 * /operator/payments — revenue KPIs + 30-day chart.
 *
 * Charts are an inline SVG line/area in brass — we deliberately avoided
 * recharts here. Bundle stays small, the visual is consistent with the
 * Aman-grade restraint of the rest of the UI, and the implementation is
 * ~100 lines we control.
 */
import { formatKES } from "@lib/trimly/pricing";

import { fetchRevenueSnapshot } from "../_lib/operator-data";
import { requireOperator } from "../_lib/require-operator";
import { OperatorHeader } from "../_components/OperatorHeader";
import { RevenueChart } from "../_components/RevenueChart";

export const metadata = { title: "Payments · Trimly operator" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const operator = await requireOperator("/operator/payments");
  const snap = await fetchRevenueSnapshot();

  // Day-over-day delta from yesterday → today, for the "Today" KPI
  const yesterday = snap.series[snap.series.length - 2]?.revenueKES ?? snap.todayKES;
  const dod = yesterday > 0 ? Math.round(((snap.todayKES - yesterday) / yesterday) * 100) : 0;

  return (
    <main className="t-dash">
      <OperatorHeader operatorName={operator.name} current="payments" />

      <div className="t-kpis">
        <div className="t-kpi">
          <span className="t-kpi__label">Today</span>
          <span className="t-kpi__value">{formatKES(snap.todayKES)}</span>
          <span className={`t-kpi__delta${dod > 0 ? " t-kpi__delta--up" : dod < 0 ? " t-kpi__delta--down" : ""}`}>
            {dod > 0 ? "▲ " : dod < 0 ? "▼ " : ""}
            {dod !== 0 ? Math.abs(dod) + "% vs yesterday · " : ""}
            {snap.todayCuts} cut{snap.todayCuts === 1 ? "" : "s"}
          </span>
        </div>
        <div className="t-kpi">
          <span className="t-kpi__label">This week</span>
          <span className="t-kpi__value">{formatKES(snap.weekKES)}</span>
          <span className="t-kpi__delta">{snap.weekCuts} cuts · 7 days</span>
        </div>
        <div className="t-kpi">
          <span className="t-kpi__label">This month</span>
          <span className="t-kpi__value">{formatKES(snap.monthKES)}</span>
          <span className="t-kpi__delta">{snap.monthCuts} cuts · 30 days</span>
        </div>
        <div className="t-kpi">
          <span className="t-kpi__label">Pending</span>
          <span className="t-kpi__value">{formatKES(snap.pendingKES)}</span>
          <span className="t-kpi__delta">
            {snap.pendingCount} unconfirmed · the reconciliation cron will sweep these
          </span>
        </div>
      </div>

      <div className="t-section-row">
        <h2>
          Revenue over the last <em>30 days</em>
        </h2>
        <p style={{ margin: 0, color: "var(--trimly-text-muted)", fontSize: 13 }}>
          KES, settled only. Pending charges roll in once the webhook (or the reconciliation cron) confirms.
        </p>
      </div>

      <RevenueChart series={snap.series} />

      <p
        style={{
          marginTop: 24,
          maxWidth: "70ch",
          fontSize: 13,
          color: "var(--trimly-text-muted)",
          lineHeight: 1.6,
        }}>
        Refunds run out of band — M-Pesa refunds go through Paystack support (2 business days);
        card refunds through the Paystack dashboard (instant). The "Pending" KPI tracks charges
        that haven't reached settled status — the reconciliation cron sweeps these every 5 minutes,
        so a number much above zero for more than 15 minutes warrants a look at the Paystack
        dashboard.
      </p>
    </main>
  );
}
