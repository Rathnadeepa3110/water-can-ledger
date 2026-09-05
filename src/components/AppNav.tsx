import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Daily Entry" },
  { to: "/customers", label: "Customers" },
  { to: "/history", label: "History" },
  { to: "/pending", label: "Pending" },
] as const;

export function AppNav() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="text-base font-semibold tracking-tight">
          Water Can Accounts
        </Link>
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
