import { redirect } from "next/navigation";

/** Version history is available per definition (changelog tab). */
export default function HistoryPage() {
  redirect("/app/definitions");
}
