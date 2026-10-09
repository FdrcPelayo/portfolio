import Link from "next/link"
import { site } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5 text-sm">
      <Link href="/" className="font-medium tracking-tight">
        {site.name}
      </Link>
      <nav className="flex items-center gap-5 text-muted-foreground">
        <Link href="/how-it-works" className="transition-colors hover:text-foreground">
          How it works
        </Link>
        {site.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="hidden transition-colors hover:text-foreground sm:inline"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
