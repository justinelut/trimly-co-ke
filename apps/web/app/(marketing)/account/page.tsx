/**
 * /account — redirects to the default tab.
 * No content of its own; the actual dashboard lives at /account/upcoming.
 */
import { redirect } from "next/navigation";

export default function AccountIndex() {
  redirect("/account/upcoming");
}
