import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Services",
    () => "Manage Trimly services and pricing",
    undefined,
    undefined,
    "/settings/trimly/services"
  );

export default async function ServicesPage() {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session) redirect("/auth/login?callbackUrl=/settings/trimly/services");

  const services = await prisma.trimlyService.findMany({
    select: { id: true, name: true, slug: true, durationMin: true, priceKESNakuru: true, priceKESNairobi: true, isActive: true },
    orderBy: { name: "asc" },
  });

  const plans = await prisma.trimlyPlan.findMany({
    select: { id: true, name: true, slug: true, cutsPerMonth: true, priceKES: true, isActive: true },
    orderBy: { priceKES: "asc" },
  });

  return (
    <div className="border-subtle mx-auto w-full max-w-4xl border-x px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-cal text-emphasis text-2xl font-semibold">Services & Plans</h1>
          <p className="text-subtle text-sm mt-1">Manage pricing and availability</p>
        </div>
        <Link
          href="/admin/collections/services"
          className="bg-emphasis text-emphasis-foreground hover:bg-emphasis/90 rounded-md px-3 py-2 text-sm font-medium">
          Edit in CMS
        </Link>
      </div>

      <h2 className="text-emphasis mb-3 text-lg font-medium">Per-cut services</h2>
      <div className="border-subtle mb-8 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-subtle px-4 py-3 text-left font-medium">Service</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Duration</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Nakuru</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Nairobi</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-subtle divide-y">
            {services.map((svc) => (
              <tr key={svc.id}>
                <td className="text-emphasis px-4 py-3 font-medium">{svc.name}</td>
                <td className="text-default px-4 py-3">{svc.durationMin} min</td>
                <td className="text-default px-4 py-3">KES {svc.priceKESNakuru.toLocaleString("en-KE")}</td>
                <td className="text-default px-4 py-3">KES {svc.priceKESNairobi.toLocaleString("en-KE")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${svc.isActive ? "bg-success/10 text-success" : "bg-subtle text-subtle"}`}>
                    {svc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-emphasis mb-3 text-lg font-medium">Subscription plans</h2>
      <div className="border-subtle overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-subtle px-4 py-3 text-left font-medium">Plan</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Cuts/mo</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Price</th>
              <th className="text-subtle px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-subtle divide-y">
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="text-emphasis px-4 py-3 font-medium">{plan.name}</td>
                <td className="text-default px-4 py-3">{plan.cutsPerMonth}</td>
                <td className="text-default px-4 py-3">KES {plan.priceKES.toLocaleString("en-KE")}/mo</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${plan.isActive ? "bg-success/10 text-success" : "bg-subtle text-subtle"}`}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
