import Link from "next/link"
import Image from "next/image"
import { CodeXml, BriefcaseBusiness, Mail } from "lucide-react"
import { site } from "@/lib/site"

const profileIcons = { GitHub: CodeXml, LinkedIn: BriefcaseBusiness, Email: Mail }

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-18 w-full max-w-3xl shrink-0 items-center justify-between gap-4 px-6 text-sm">
      <Link href="/" aria-label={`${site.name} home`} className="flex items-center gap-2.5 font-medium tracking-tight">
        <Image src="/brand/fp-logo.png" alt="" width={30} height={30} className="shrink-0" />
        <span className="hidden sm:inline">{site.name}</span>
      </Link>
      <nav className="flex items-center gap-2 text-muted-foreground sm:gap-5">
        <Link href="/how-it-works" className="flex min-h-9 items-center transition-colors hover:text-foreground">
          How it works
        </Link>
        {site.links.map((l) => {
          const Icon = profileIcons[l.label as keyof typeof profileIcons]
          return <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            className="inline-flex size-9 items-center justify-center transition-colors hover:text-foreground sm:size-auto"
          >
            <Icon className="size-4 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">{l.label}</span>
          </a>
        })}
      </nav>
    </header>
  )
}
