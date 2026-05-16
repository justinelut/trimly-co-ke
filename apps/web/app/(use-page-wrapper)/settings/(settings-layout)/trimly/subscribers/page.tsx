import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Subscribers",
    () => "Manage Trimly subscription customers",
    undefined,
    undefined,
    "/settings/trimly/subscribers"
  );

export default async function SubscribersPage() {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session) redirect("/auth/login?callbackUrl=/settings/trimly/subscribers");

  const subscriptions = await prisma.trimlySubscription.findMany({
    select: {
      id: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cutsRemaining: true,
      cancelAtPeriodEnd: true,
      user: { select: { id: true, name: true, email: true, trimlyPhone: true } },
      plan: { select: { name: true, slug: true, cutsPerMonth: true, priceKES: true } },
    },
    orderBy: { currentPeriodEnd: "asc" },
  });

  const stats = {
    active: subscriptions.filter((s) => s.status === "active").length,
    pastDue: subscriptions.filter((s) => s.status === "past_due").length,
    cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    total: subscriptions.length,
  };

  return (
    <div className="border-subtle mx-auto w-full max-w-4xl border-x px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-cal text-emphasis text-2xl font-semibold">Subscribers</h1>
        <p className="text-subtle text-sm mt-1">All Trimly subscription customers</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Past due" value={stats.pastDue} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Total" value={stats.total} />
      </div>

      <div className="border-subtle overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-subtle px-4 py-3 text-left font-medium">Customer</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Plan</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Status</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Renews</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Cuts left</th>
            </tr>
          </thead>
          <tbody className="divide-subtle divide-y">
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td className="px-4 py-3">
                  <p className="text-emphasis font-medium">{sub.user.name || "—"}</p>
                  <p className="text-subtle text-xs">{sub.user.email}</p>
                </td>
                <td className="text-default px-4 py-3">{sub.plan.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={sub.status} cancelling={sub.cancelAtPeriodEnd} />
                </td>
                <td className="text-default px-4 py-3 text-xs">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </td>
                <td className="text-default px-4 py-3">{sub.cutsRemaining}</td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-subtle px-4 py-8 text-center">No subscribers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-subtle rounded-md border p-4">
      <p className="text-subtle text-xs font-medium uppercase">{label}</p>
      <p className="text-emphasis text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status, cancelling }: { status: string; cancelling: boolean }) {
  const colors: Record<string, string> = {
    active: "bg-success/10 text-success",
    past_due: "bg-attention/10 text-attention",
    cancelled: "bg-error/10 text-error",
    non_renewing: "bg-subtle text-subtle",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-subtle text-subtle"}`}>
      {cancelling ? "Cancelling" : status.replace("_", " ")}
    </span>
  );
}
