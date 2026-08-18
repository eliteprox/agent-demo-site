export const SITE = {
  name: "Livepeer Agent",
  tagline: "AI agent compute, billed by the second on Livepeer.",
  oneLiner:
    "Give your agent real compute: mint an API key, add credit, and run playbooks against Livepeer's network.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/usage", label: "Usage" },
  { href: "/api", label: "API Keys" },
  { href: "/api-logs", label: "Logs" },
  { href: "/playbooks", label: "Playbooks" },
] as const;

export function formatUsd(amount: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export type Playbook = {
  slug: string;
  title: string;
  summary: string;
  category: string;
};

/**
 * Static recipe catalog — no backend. A representative slice across the
 * categories the mockup showed, not a fabricated 150-row list.
 */
export const PLAYBOOKS: Playbook[] = [
  {
    slug: "typographic-social-cut",
    title: "Typographic Social Cut",
    summary: "Captions, tracked overlays, on-video type for short-form social.",
    category: "Content creation",
  },
  {
    slug: "weather-injection",
    title: "Weather Injection",
    summary: "Add rain, snow, or fog to existing footage without a reshoot.",
    category: "Visual effects",
  },
  {
    slug: "object-removal",
    title: "Object Removal",
    summary: "Clean-plate a shot: remove a person, rig, or prop across frames.",
    category: "Visual effects",
  },
  {
    slug: "green-screen-replace",
    title: "Green-Screen Replacement",
    summary: "Swap a keyed background for a generated or stock environment.",
    category: "Visual effects",
  },
  {
    slug: "music-video-cut",
    title: "Music Video Cut",
    summary: "Beat-synced edit from raw performance and B-roll footage.",
    category: "Video production",
  },
  {
    slug: "commercial-spot",
    title: "30-Second Commercial",
    summary: "Product beauty shots into a paced spot with a CTA end card.",
    category: "Video production",
  },
  {
    slug: "explainer-video",
    title: "Explainer Video",
    summary: "Script-to-storyboard-to-cut for a product explainer.",
    category: "Video production",
  },
  {
    slug: "documentary-assembly",
    title: "Documentary Assembly",
    summary: "Interview transcripts into a rough-cut with b-roll suggestions.",
    category: "Video production",
  },
  {
    slug: "game-asset-turnaround",
    title: "Game Asset Turnaround",
    summary: "Concept art into a textured, rigged asset turntable.",
    category: "Design & 3D",
  },
  {
    slug: "print-to-3d",
    title: "3D-Print Prep",
    summary: "Mesh cleanup, hollowing, and support generation for printing.",
    category: "Design & 3D",
  },
  {
    slug: "cad-conversion",
    title: "CAD Conversion",
    summary: "Freeform scan or sketch into clean parametric CAD geometry.",
    category: "Design & 3D",
  },
  {
    slug: "logo-animation",
    title: "Logo Animation",
    summary: "Static logo into a short animated sting for intros/outros.",
    category: "Design & 3D",
  },
  {
    slug: "short-form-social",
    title: "Short-Form Social Pack",
    summary: "One long-form video into five vertical clips with hooks.",
    category: "Content creation",
  },
  {
    slug: "podcast-highlights",
    title: "Podcast Highlights",
    summary: "Full episode audio into clipped, captioned highlight reels.",
    category: "Content creation",
  },
  {
    slug: "webtoon-panels",
    title: "Webtoon Panels",
    summary: "Script and character sheet into sequential webtoon panels.",
    category: "Content creation",
  },
  {
    slug: "character-animation-loop",
    title: "Character Animation Loop",
    summary: "Reference pose sheet into a seamless idle-animation loop.",
    category: "Content creation",
  },
  {
    slug: "product-photography",
    title: "Product Photography",
    summary: "Raw product shots into clean, consistent catalog images.",
    category: "E-commerce",
  },
  {
    slug: "catalog-variants",
    title: "Catalog Color Variants",
    summary: "One hero shot into every colorway variant for a listing.",
    category: "E-commerce",
  },
  {
    slug: "lookbook-generation",
    title: "Lookbook Generation",
    summary: "Flat-lay product shots into a styled seasonal lookbook.",
    category: "E-commerce",
  },
  {
    slug: "medical-imaging-overlay",
    title: "Medical Imaging Overlay",
    summary: "Annotate scan series with structure overlays for review.",
    category: "Specialized",
  },
  {
    slug: "real-estate-listing",
    title: "Real Estate Listing Reel",
    summary: "Walkthrough footage into a paced listing video with captions.",
    category: "Specialized",
  },
];

export const PLAYBOOK_CATEGORIES = Array.from(new Set(PLAYBOOKS.map((p) => p.category)));
