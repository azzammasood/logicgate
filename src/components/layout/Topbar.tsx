import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface TopbarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}

export function Topbar({ title, breadcrumbs = [], children }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#161920]/80 px-6 backdrop-blur">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="mb-0.5 flex items-center gap-1 text-xs text-white/40">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#4ade80]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-[family-name:var(--font-syne)] text-lg font-semibold">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

