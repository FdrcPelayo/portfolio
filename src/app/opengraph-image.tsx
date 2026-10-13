import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { site } from "@/lib/site"

export const alt = "Francisco Pelayo — AI & Algorithms, DTU MSc graduate"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const [logo, headshot] = await Promise.all([
    readFile(path.join(process.cwd(), "public/brand/fp-logo.png")),
    readFile(path.join(process.cwd(), "public/headshot.jpeg")),
  ])
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#fff", color: "#171717", padding: 64, alignItems: "center", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="" width={72} height={72} />
        <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: -2, marginTop: 36, lineHeight: 1.05 }}>Francisco Pelayo</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 24, lineHeight: 1.4 }}>AI &amp; Algorithms</div>
        <div style={{ display: "flex", fontSize: 22, color: "#525252", marginTop: 14 }}>DTU MSc · Electrical Engineering background</div>
        <div style={{ display: "flex", fontSize: 20, marginTop: 40 }}>Get to know me. Ask my portfolio.</div>
      </div>
      <img src={`data:image/jpeg;base64,${headshot.toString("base64")}`} alt={site.name} width={320} height={400} style={{ objectFit: "cover", borderRadius: 16 }} />
    </div>,
    size,
  )
}
