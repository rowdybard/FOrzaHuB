import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://gripcafe.com'
const DEFAULT_DESC =
  'Host competitive sim racing events with verified proof, public leaderboards, and community prizes. Build your racing community with scheduled tournaments, club management, and championship scoring.'

export default function Seo({ title, description, path, image }) {
  const fullTitle = title
    ? `${title} — GripCafe`
    : 'GripCafe — Run Verified Tournaments for Your Sim Racing Community'
  const desc = description || DEFAULT_DESC
  const url = path ? `${SITE_URL}${path}` : SITE_URL
  const img = image || '/background.png'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
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
