// Enforce trailing slash on HTML pages
// Skips assets, API routes, and paths that already have a trailing slash
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

  // Redirect to trailing slash version
  url.pathname = path + '/';
  return new Response(null, {
    status: 301,
    headers: { Location: url.toString() }
  });
};
