// Francisco's public portfolio profile.
export const site = {
  name: "Francisco Pelayo",
  tagline: "DTU MSc graduate in Computer Science · Machine Learning & Data Science · Electrical Engineering background",
  photo: "/headshot.jpeg",
  email: "francisco.drcp@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/FdrcPelayo/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/fdrcpelayo/" },
    { label: "Email", href: "mailto:francisco.drcp@gmail.com" },
  ],
  suggestions: [
    "Who are you?",
    "What did you specialize in at DTU?",
    "How does electrical engineering connect to your ML background?",
  ],
  // Any model available on Vercel AI Gateway: "provider/model"
  chatModel: "anthropic/claude-sonnet-5.5",
  embeddingModel: "openai/text-embedding-3-small",
}
