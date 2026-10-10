import Image from "next/image"
import { Chat } from "@/components/chat"
import { site } from "@/lib/site"

export default function Home() {
  return (
    <main className="mx-auto flex h-[calc(100dvh-4.5rem)] min-h-0 w-full max-w-3xl flex-none flex-col px-6 pb-4">
      <Chat
        intro={
          <div className="flex flex-col items-center gap-4 text-center">
            <Image
              src={site.photo}
              alt={site.name}
              width={112}
              height={112}
              priority
              unoptimized={site.photo.endsWith(".svg")}
              className="size-28 rounded-full object-cover ring-1 ring-border"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
              <p className="text-sm text-muted-foreground">{site.tagline}</p>
            </div>
          </div>
        }
      />
    </main>
  )
}
