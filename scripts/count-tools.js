const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '..', 'assets/js/components/tool-registry.js'), 'utf8'));
const live = AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new');
const pending = AFRO_TOOLS.filter(t => t.status !== 'live' && t.status !== 'new');
const english = AFRO_TOOLS.filter(t => !t.lang || t.lang === 'en');

function getCountDetails(filterFn) {
  const tools = AFRO_TOOLS.filter(t => {
    const langOk = !t.lang || t.lang === 'en';
    return langOk && (typeof filterFn === 'function' ? filterFn(t) : true);
  });
  const normalizeHref = (href, fallback) => (href || fallback || '')
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '')
    .toLowerCase();

  const hrefs = [];
  const seen = new Set();
  const weightedFamilies = new Map();
  for (const tool of tools) {
    const hrefKey = normalizeHref(tool.href, tool.id);
    if (!seen.has(hrefKey)) {
      seen.add(hrefKey);
      hrefs.push(hrefKey);
    }

    const count = Number(tool.toolCount) || 1;
    if (count > 1 && count > (weightedFamilies.get(hrefKey) || 0)) {
      weightedFamilies.set(hrefKey, count);
    }
  }

  let hiddenVariants = 0;
  for (const [familyHref, declaredCount] of weightedFamilies.entries()) {
    const explicitFamilyUrls = hrefs.filter(href => href === familyHref || href.startsWith(familyHref + '/')).length;
    hiddenVariants += Math.max(0, declaredCount - explicitFamilyUrls);
  }

  return {
    entries: tools.length,
    uniqueUrls: hrefs.length,
    hiddenVariants,
    instances: hrefs.length + hiddenVariants,
  };
}

const allDetails = getCountDetails();
const liveDetails = getCountDetails(t => t.status === 'live' || t.status === 'new');
const agricultureDetails = getCountDetails(t => t.category === 'agriculture');
const totalInstances = typeof getTotalToolCount === 'function' ? getTotalToolCount() : english.length;
const liveInstances = typeof getTotalToolCount === 'function'
  ? getTotalToolCount(t => t.status === 'live' || t.status === 'new')
  : live.length;
const pendingInstances = totalInstances - liveInstances;
console.log('Registry entries:', AFRO_TOOLS.length, 'Live entries:', live.length, 'Pending entries:', pending.length);
console.log('EN entries:', english.length, 'Distinct EN tool instances:', totalInstances, 'Live/new instances:', liveInstances, 'Pending instances:', pendingInstances);
console.log('EN unique URLs:', allDetails.uniqueUrls, 'Declared non-duplicated variants:', allDetails.hiddenVariants);
console.log('Agriculture:', agricultureDetails.uniqueUrls, 'unique URLs +', agricultureDetails.hiddenVariants, 'declared variants =', agricultureDetails.instances, 'instances');
