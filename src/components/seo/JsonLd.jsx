// Structured data for search engines: <JsonLd data={{ '@type': 'NewsArticle', … }} /> (or an array of items).
// "<" is escaped so text from the database can never close the script tag.
export default function JsonLd({ data }) {
  const items = Array.isArray(data) ? data : [data];
  const json = JSON.stringify(items.length === 1 ? { '@context': 'https://schema.org', ...items[0] } : { '@context': 'https://schema.org', '@graph': items });
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\u003c') }} />;
}
