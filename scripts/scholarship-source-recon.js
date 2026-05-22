#!/usr/bin/env node

const { checkRobots, DEFAULT_USER_AGENT } = require('../netlify/functions/_shared/scholarship-source-adapters');

const urls = process.argv.slice(2).filter(function (arg) {
  return arg && arg !== '--json';
});

function recommendation(result) {
  if (!result.robotsAllowed) {
    return 'do_not_scrape: robots or network protection did not allow this URL from the current environment';
  }
  if (/findaphd\.com/i.test(result.url)) {
    return 'reference_only: use as research context or pursue permission/partnership before ingestion';
  }
  if (/bachelorsportal\.com|studyportals\.com/i.test(result.url)) {
    return 'discovery_only: use sitemap/detail pages as leads, then verify against canonical provider pages';
  }
  return 'candidate: verify terms and build an official-source parser before row creation';
}

async function inspect(url) {
  const result = {
    url: url,
    checkedAt: new Date().toISOString(),
    userAgent: DEFAULT_USER_AGENT
  };

  try {
    const robots = await checkRobots(url, { userAgent: DEFAULT_USER_AGENT });
    Object.assign(result, {
      robotsUrl: robots.robotsUrl,
      robotsStatus: robots.robotsStatus,
      robotsAllowed: !!robots.robotsAllowed
    });
  } catch (error) {
    Object.assign(result, {
      robotsUrl: '',
      robotsStatus: 0,
      robotsAllowed: false,
      error: error.message
    });
  }

  result.recommendation = recommendation(result);
  return result;
}

async function main() {
  if (!urls.length) {
    console.error('Usage: node scripts/scholarship-source-recon.js <url> [url...]');
    process.exit(1);
  }

  const results = [];
  for (const url of urls) {
    results.push(await inspect(url));
  }

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    results: results
  }, null, 2));
}

main().catch(function (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
