// Small user-agent parser for the login / activity logs → { browser, os, device }
const BROWSERS = [
  [/Edg(?:e|A|iOS)?\/([\d]+)/, 'Edge'],
  [/OPR\/([\d]+)|Opera\/([\d]+)/, 'Opera'],
  [/SamsungBrowser\/([\d]+)/, 'Samsung Internet'],
  [/(?:Chrome|CriOS)\/([\d]+)/, 'Chrome'],
  [/(?:Firefox|FxiOS)\/([\d]+)/, 'Firefox'],
  [/Version\/([\d]+).*Safari/, 'Safari'],
];
const SYSTEMS = [
  [/Windows NT 10/, 'Windows 10/11'],
  [/Windows NT/, 'Windows'],
  [/Android ([\d.]+)/, 'Android'],
  [/iPhone OS ([\d_]+)|iPad.*OS ([\d_]+)/, 'iOS'],
  [/Mac OS X/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export function parseUserAgent(ua = '') {
  let browser = 'Unknown';
  for (const [re, name] of BROWSERS) {
    const m = ua.match(re);
    if (m) {
      const version = m.slice(1).find(Boolean);
      browser = version ? `${name} ${version}` : name;
      break;
    }
  }
  let os = 'Unknown';
  for (const [re, name] of SYSTEMS) {
    const m = ua.match(re);
    if (m) {
      const version = m.slice(1).find(Boolean);
      os = name === 'Android' || name === 'iOS' ? `${name}${version ? ` ${version.replace(/_/g, '.')}` : ''}` : name;
      break;
    }
  }
  const device = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Mobile' : ua ? 'Desktop' : 'Unknown';
  return { browser, os, device };
}
