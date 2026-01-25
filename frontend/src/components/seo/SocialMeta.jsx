export function SocialMeta({ title, description, image, url }) {
  return (
    <>
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BattleZone" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@battlezone" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="alternate" hrefLang="en-IN" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
    </>
  );
}
