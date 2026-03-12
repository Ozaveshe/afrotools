# Quick check: does _redirects already exist?
curl -sL https://afrotools.com/_redirects -o /dev/null -w "%{http_code}"
