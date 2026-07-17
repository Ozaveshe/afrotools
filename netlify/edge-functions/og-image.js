// Dynamic OG image generator for AfroTools
// Generates a 1200x630 SVG with tool name, country flag, and optional result
// Brand colours: #0062CC (primary blue), #0A1628 (dark bg), #4DA3FF (light blue)

export default async (request) => {
  const url = new URL(request.url);
  const title = url.searchParams.get('title') || 'AfroTools';
  const country = url.searchParams.get('country') || '';
  const subtitle = url.searchParams.get('sub') || "Africa's Financial Operating System";
  const result = url.searchParams.get('result') || '';

  // Country flag emoji mapping (top African countries)
  const flags = {
    'NG': '🇳🇬', 'KE': '🇰🇪', 'GH': '🇬🇭', 'ZA': '🇿🇦',
    'EG': '🇪🇬', 'TZ': '🇹🇿', 'RW': '🇷🇼', 'MA': '🇲🇦',
    'SN': '🇸🇳', 'CI': '🇨🇮', 'CM': '🇨🇲', 'CD': '🇨🇩',
    'ET': '🇪🇹', 'UG': '🇺🇬', 'DZ': '🇩🇿', 'MG': '🇲🇬'
  };
  const flag = flags[country] || '🌍';

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0A1628"/>
        <stop offset="100%" stop-color="#0f1e3d"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>

    <!-- Blue accent bar top -->
    <rect x="0" y="0" width="1200" height="6" fill="#0062CC"/>

    <!-- AfroTools wordmark -->
    <text x="60" y="80" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#4DA3FF" letter-spacing="2">
      AFROTOOLS
    </text>

    <!-- Country flag -->
    <text x="60" y="285" font-size="80">${flag}</text>

    <!-- Tool title -->
    <text x="185" y="260" font-family="system-ui, sans-serif" font-size="52" font-weight="800" fill="#ffffff" letter-spacing="-1">
      ${escapeXml(title)}
    </text>

    <!-- Subtitle -->
    <text x="185" y="308" font-family="system-ui, sans-serif" font-size="22" fill="#8fa8c8">
      ${escapeXml(subtitle)}
    </text>

    ${result ? `
    <!-- Result highlight box -->
    <rect x="60" y="380" width="1080" height="100" rx="16" fill="#0062CC" opacity="0.12"/>
    <rect x="60" y="380" width="4" height="100" rx="2" fill="#0062CC"/>
    <text x="90" y="443" font-family="system-ui, sans-serif" font-size="36" font-weight="700" fill="#4DA3FF">
      ${escapeXml(result)}
    </text>
    ` : ''}

    <!-- Bottom tagline -->
    <text x="60" y="582" font-family="system-ui, sans-serif" font-size="18" fill="#4e6a8a">
      afrotools.com · Free · No sign-up · AI-powered
    </text>

    <!-- Blue accent bar bottom -->
    <rect x="0" y="624" width="1200" height="6" fill="#0062CC"/>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const config = { path: "/og-image" };
