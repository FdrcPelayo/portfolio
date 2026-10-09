// Edit these to make the site yours.
export const site = {
  name: "Your Name",
  tagline: "Ask me anything about my work, projects and experience.",
  photo: "/me.svg", // drop your photo in /public (e.g. /me.jpg) and point here
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
  ],
  suggestions: [
    "Who are you?",
    "What are you working on right now?",
    "What's your tech stack?",
  ],
  // Any model available on Vercel AI Gateway: "provider/model"
  chatModel: "anthropic/claude-sonnet-5.5",
  embeddingModel: "openai/text-embedding-3-small",
}
