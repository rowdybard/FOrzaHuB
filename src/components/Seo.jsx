import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://gripcafe.com'
const DEFAULT_DESC =
  'Run a Forza Horizon 6 tournament for your Discord community. Time trials, drift, drag, build battles, and photo contests with verified proof and public leaderboards.'

export default function Seo({ title, description, path, image, ogType = 'website' }) {
  const fullTitle = title
    ? `${title} — GripCafe`
    : 'Forza Horizon 6 Clubs, Community Challenges & Leaderboards — GripCafe'
  const desc = description || DEFAULT_DESC
  const url = path ? `${SITE_URL}${path}` : SITE_URL
  const img = image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:site_name" content="GripCafe" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}
