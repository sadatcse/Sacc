const SEARCH_ENGINES = [
  { name: 'Google', pattern: 'google.' },
  { name: 'Bing', pattern: 'bing.com' },
  { name: 'Yahoo', pattern: 'yahoo.com' },
  { name: 'DuckDuckGo', pattern: 'duckduckgo.com' },
  { name: 'Baidu', pattern: 'baidu.com' },
  { name: 'Yandex', pattern: 'yandex.' },
  { name: 'Ecosia', pattern: 'ecosia.org' },
];

// Classifies a referrer URL as Direct / Search Engine / Referral.
export function detectSource(referrer) {
  if (!referrer) return { source: 'Direct', sourceName: 'Direct' };
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const engine = SEARCH_ENGINES.find((se) => host.includes(se.pattern));
    if (engine) return { source: 'Search Engine', sourceName: engine.name };
    return { source: 'Referral', sourceName: host };
  } catch {
    return { source: 'Direct', sourceName: 'Direct' };
  }
}

export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'Unknown';
}

export async function resolveCountry(req, ip) {
  const headerCountry = req.headers.get('x-vercel-ip-country');
  if (headerCountry) return headerCountry;
  if (!ip || ip === 'Unknown' || ip === '127.0.0.1' || ip === '::1') return 'Unknown';
  try {
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = res.ok ? await res.json() : null;
    return data?.success ? data.country : 'Unknown';
  } catch {
    return 'Unknown';
  }
}
