const recorder = [
  '/tools/creator-record/app', '/fr/tools/enregistrement-pour-createur/app', '/sw/zana/kirekodi-skrini/'
];
const voice = [
  '/tools/creator-voice/app', '/fr/tools/voix-de-marque-du-createur/app', '/sw/zana/rekodi-na-hariri-sauti/'
];
const clip = [
  '/tools/creator-clip/app', '/fr/tools/decoupe-de-video-pour-createur/app', '/sw/zana/kukata-video-za-mtayarishi/'
];
const fuel = [
  '/tools/fuel-tracker/', '/fr/tools/suivi-carburant/', '/sw/zana/ufuatiliaji-bei-za-mafuta/'
];

const tools = new Map();
for (const [paths, features] of [[recorder, ['camera', 'microphone']], [voice, ['microphone']], [clip, []], [fuel, ['geolocation']]]) {
  for (const path of paths) {
    const variants = path.endsWith('/') ? [path, path + 'index.html', path.slice(0, -1)] : [path, path + '.html'];
    for (const variant of variants) tools.set(variant, features);
  }
}

export function policyForTool(path) {
  return tools.get(path);
}

export function applyToolPolicy(response, features) {
  if (response.status !== 200 || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  // Retain every unrelated site policy and the visitor's normal browser permission prompt.
  const policy = headers.get('Permissions-Policy');
  if (policy && features.length) {
    headers.set('Permissions-Policy', policy.split(',').map(entry => {
      const feature = entry.trim().split('=')[0];
      return features.includes(feature) ? feature + '=(self)' : entry.trim();
    }).join(', '));
  }
  // MediaRecorder and local file previews use object URLs; keep the remaining CSP intact.
  const csp = headers.get('Content-Security-Policy');
  if (csp && !features.includes('geolocation') && !/(?:^|;)\s*media-src\s/i.test(csp)) {
    headers.set('Content-Security-Policy', csp.replace(/;?\s*$/, '') + "; media-src 'self' blob:");
  }
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
