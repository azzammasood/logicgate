import { cn } from "@/lib/utils";

/** Themed loading placeholder. Uses the global `.lg-skeleton` shimmer. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("lg-skeleton", className)} {...props} />;
}
