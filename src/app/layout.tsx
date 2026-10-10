import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site } from "@/lib/site"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const title = `${site.name} | Machine Learning & Data Science`
const description = "Meet Francisco Pelayo, a DTU MSc graduate in Computer Science specializing in Machine Learning and Data Science, with a background in electrical engineering. Explore his profile through an interactive conversation."
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "http://localhost:3000")),
  title: { default: title, template: `%s | ${site.name}` },
  description,
  applicationName: `${site.name} Portfolio`,
  authors: [{ name: site.name }],
  creator: site.name,
  keywords: [site.name, "Machine Learning", "Data Science", "Computer Science", "DTU", "Electrical Engineering"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: `${site.name} Portfolio`,
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: site.name,
            description,
            email: site.email,
            sameAs: site.links.filter((link) => link.href.startsWith("https:")).map((link) => link.href),
            alumniOf: { "@type": "CollegeOrUniversity", name: "Technical University of Denmark" },
            knowsAbout: ["Machine Learning", "Data Science", "Computer Science", "Electrical Engineering"],
          }).replace(/</g, "\\u003c") }}
        />
        <TooltipProvider>
          <SiteHeader />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
