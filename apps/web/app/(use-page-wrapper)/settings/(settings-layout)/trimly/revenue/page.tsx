import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Revenue",
    () => "Trimly payment overview and revenue tracking",
    undefined,
    undefined,
    "/settings/trimly/revenue"
  );

export default async function RevenuePage() {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session) redirect("/auth/login?callbackUrl=/settings/trimly/revenue");

  const payments = await prisma.trimlyPayment.findMany({
    where: { status: "succeeded" },
    select: { id: true, amountKES: true, provider: true, createdAt: true, booking: { select: { id: true, city: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amountKES, 0);
  const mpesaRevenue = payments.filter((p) => p.provider === "mpesa").reduce((sum, p) => sum + p.amountKES, 0);
  const cardRevenue = payments.filter((p) => p.provider === "paystack").reduce((sum, p) => sum + p.amountKES, 0);
  const thisMonth = payments.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonth.reduce((sum, p) => sum + p.amountKES, 0);

  return (
    <div className="border-subtle mx-auto w-full max-w-4xl border-x px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-cal text-emphasis text-2xl font-semibold">Revenue</h1>
        <p className="text-subtle text-sm mt-1">Payment overview and transaction history</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total revenue" value={`KES ${totalRevenue.toLocaleString("en-KE")}`} />
        <StatCard label="This month" value={`KES ${monthlyRevenue.toLocaleString("en-KE")}`} />
        <StatCard label="M-Pesa" value={`KES ${mpesaRevenue.toLocaleString("en-KE")}`} />
        <StatCard label="Card" value={`KES ${cardRevenue.toLocaleString("en-KE")}`} />
      </div>

      <div className="border-subtle overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-subtle px-4 py-3 text-left font-medium">Date</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Amount</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Method</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">City</th>
            </tr>
          </thead>
          <tbody className="divide-subtle divide-y">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="text-default px-4 py-3 text-xs">
                  {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="text-emphasis px-4 py-3 font-medium">
                  KES {p.amountKES.toLocaleString("en-KE")}
                </td>
                <td className="text-default px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${p.provider === "mpesa" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                    {p.provider === "mpesa" ? "M-Pesa" : "Card"}
                  </span>
                </td>
                <td className="text-default px-4 py-3">{p.booking?.city || "—"}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={4} className="text-subtle px-4 py-8 text-center">No payments yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-subtle rounded-md border p-4">
      <p className="text-subtle text-xs font-medium uppercase">{label}</p>
      <p className="text-emphasis text-xl font-semibold">{value}</p>
    </div>
  );
}
