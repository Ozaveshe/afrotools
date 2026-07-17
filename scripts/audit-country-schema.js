var fs = require('fs');
var path = require('path');

// Key country hub pages
var countries = [
  {dir:'ghana', name:'Ghana', url:'ghana'},
  {dir:'nigeria', name:'Nigeria', url:'nigeria'},
  {dir:'kenya', name:'Kenya', url:'kenya'},
  {dir:'south-africa', name:'South Africa', url:'south-africa'},
  {dir:'ethiopia', name:'Ethiopia', url:'ethiopia'},
  {dir:'egypt', name:'Egypt', url:'egypt'},
  {dir:'tanzania', name:'Tanzania', url:'tanzania'},
  {dir:'uganda', name:'Uganda', url:'uganda'},
  {dir:'senegal', name:'Senegal', url:'senegal'},
  {dir:'cameroon', name:'Cameroon', url:'cameroon'},
  {dir:'cote-divoire', name:'Côte d\'Ivoire', url:'cote-divoire'},
  {dir:'rwanda', name:'Rwanda', url:'rwanda'},
  {dir:'morocco', name:'Morocco', url:'morocco'},
  {dir:'zambia', name:'Zambia', url:'zambia'},
  {dir:'zimbabwe', name:'Zimbabwe', url:'zimbabwe'},
  {dir:'botswana', name:'Botswana', url:'botswana'},
  {dir:'malawi', name:'Malawi', url:'malawi'},
];

var missing = [];
var hasSchema = [];

countries.forEach(function(c) {
  var f = path.join(process.cwd(), c.dir, 'index.html');
  if (!fs.existsSync(f)) return;
  var html = fs.readFileSync(f, 'utf8');
  var hasBreadcrumb = html.includes('BreadcrumbList');
  var hasLdJson = html.includes('application/ld+json');
  var hasTwitter = html.includes('twitter:title');
  console.log((hasBreadcrumb ? '✓ ' : '✗ ') + c.dir + (hasLdJson ? ' [has schema]' : ' [NO schema]') + (hasTwitter ? ' [has twitter]' : ' [NO twitter]'));
  if (!hasBreadcrumb) missing.push(c);
  else hasSchema.push(c);
});

console.log('\nMissing breadcrumb: ' + missing.map(function(c){return c.dir}).join(', '));
