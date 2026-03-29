// Enforce trailing slash on directory paths only.
// Skips assets, API routes, and paths that already have a trailing slash.
// Uses context.next() to check if Netlify can serve the path as-is (e.g. via
// Pretty URLs resolving foo.html for /foo). Only redirects to trailing-slash
// when the origin would otherwise 404.
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip if already has trailing slash, or is a file with extension, or is an API/function route
  if (
    path.endsWith('/') ||
    path.includes('.') ||
    path.startsWith('/.netlify/') ||
    path.startsWith('/api/')
  ) {
    return context.next();
  }

  // Let the origin try to serve the path as-is (Pretty URLs will serve .html files)
  const originResponse = await context.next();

  // If the origin can serve it (e.g. foo.html exists for /foo), pass it through
  if (originResponse.status !== 404) {
    return originResponse;
  }

  // Before redirecting to trailing-slash, check that the trailing-slash version
  // actually resolves (i.e. a directory with index.html exists). This prevents
  // redirect loops where /foo/ also 404s and something else redirects back.
  const trailingUrl = new URL(url);
  trailingUrl.pathname = path + '/';

  const trailingResponse = await context.next(
    new Request(trailingUrl.toString(), request)
  );

  // Only redirect if the trailing-slash version resolves to real content
  if (trailingResponse.ok) {
    return new Response(null, {
      status: 301,
      headers: { Location: trailingUrl.toString() }
    });
  }

  // Both versions 404 — return the original 404 (no redirect)
  return originResponse;
};
