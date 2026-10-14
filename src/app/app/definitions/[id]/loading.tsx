import { DefinitionSkeleton } from "@/components/skeletons/DefinitionSkeleton";

// Shown instantly on navigation while the route payload loads, so clicking a
// definition in the list responds immediately instead of appearing stuck.
export default function Loading() {
  return <DefinitionSkeleton />;
}
