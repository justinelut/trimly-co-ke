/**
 * /account/profile — editable customer profile (name, phone, preferences).
 */
import { fetchProfile } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { ProfileForm } from "../_components/ProfileForm";

export const metadata = { title: "Profile · Trimly" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const customer = await requireCustomer("/account/profile");
  const profile = await fetchProfile(customer.id, customer.email, customer.name);

  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="profile" />

      <div className="t-prof">
        <aside>
          <h2 className="t-prof__aside-title">Tell us how to find you.</h2>
          <p className="t-prof__aside-body">
            The phone here is the one we push the M-Pesa STK to and message 15 minutes before
            the cut. Your email is read-only — change it from your cal.diy account settings if
            you need to.
          </p>
        </aside>
        <ProfileForm initial={profile} />
      </div>
    </main>
  );
}
