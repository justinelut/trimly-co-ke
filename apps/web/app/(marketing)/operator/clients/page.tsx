/**
 * /operator/clients — searchable list of every customer who's ever booked.
 *
 * Search query lives in the URL (?q=...) so the page is shareable and
 * the operator can refresh without losing context. The ClientSearch
 * client component pushes the query; this server component reads it
 * and re-renders the list.
 */
import { formatKES } from "@lib/trimly/pricing";

import { fetchClients } from "../_lib/operator-data";
import { requireOperator } from "../_lib/require-operator";
import { ClientSearch } from "../_components/ClientSearch";
import { OperatorHeader } from "../_components/OperatorHeader";

export const metadata = { title: "Clients · Trimly operator" };
export const dynamic = "force-dynamic";

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const operator = await requireOperator("/operator/clients");
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const clients = await fetchClients(query);

  return (
    <main className="t-dash">
      <OperatorHeader operatorName={operator.name} current="clients" />

      <div className="t-section-row">
        <h2>
          {query ? (
            <>
              <em>{clients.length}</em> match{clients.length === 1 ? "" : "es"}
            </>
          ) : (
            <>
              <em>{clients.length}</em> client{clients.length === 1 ? "" : "s"}
            </>
          )}
        </h2>
        <ClientSearch initial={query} />
      </div>

      {clients.length === 0 ? (
        <p style={{ color: "var(--trimly-text-muted)", fontSize: 14 }}>
          No matches for "{query}".
        </p>
      ) : (
        <div className="t-clients">
          {clients.map((c) => (
            <div key={c.userId} className="t-client">
              <div className="t-client__main">
                <span className="t-client__name">{c.name}</span>
                <span className="t-client__sub-meta">
                  {c.estate}, {c.city} · {c.email}
                </span>
              </div>
              <span className="t-client__cuts">
                {c.totalCuts} cut{c.totalCuts === 1 ? "" : "s"}
              </span>
              <span className="t-client__spend">{formatKES(c.totalSpendKES)}</span>
              <span className="t-client__last">{formatRelative(c.lastCutAt)}</span>
              <span className="t-client__sub">
                {c.subscriptionStatus === null ? "—" : c.subscriptionStatus.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
