import { redirect } from "next/navigation";

/** Legacy route — merged into Reviews. */
export default function ApprovalsPage() {
  redirect("/app/reviews?view=assigned");
}
