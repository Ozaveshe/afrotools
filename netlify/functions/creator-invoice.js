// netlify/functions/creator-invoice.js
// Supabase CRUD for CreatorInvoice — invoices, items, clients, quotes
// Uses the Auth/Profiles Supabase instance

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getCorsHeaders(event) {
  const origin = event.headers?.origin || '';
  const isAllowed =
    origin === 'https://afrotools.com' ||
    origin === 'https://www.afrotools.com' ||
    origin.endsWith('.netlify.app') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://afrotools.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (!SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_KEY not configured' }) };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || 'list';

  try {
    // Public invoice view via share token
    if (action === 'view' && params.token && /^[a-f0-9]{32}$/.test(params.token)) {
      // Fetch invoice by share_token
      const invRes = await supaFetch(`/rest/v1/creator_invoices?share_token=eq.${params.token}&select=*&limit=1`);
      const invoices = await invRes.json();
      if (!invoices.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Invoice not found' }) };

      const invoice = invoices[0];

      // Fetch line items
      const itemsRes = await supaFetch(`/rest/v1/creator_invoice_items?invoice_id=eq.${invoice.id}&order=sort_order`);
      invoice.items = await itemsRes.json();

      // Increment view count
      await supaFetch(`/rest/v1/creator_invoices?id=eq.${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          view_count: (invoice.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
          status: invoice.status === 'sent' ? 'viewed' : invoice.status
        })
      });

      // Strip sensitive fields before returning
      delete invoice.user_id;
      return { statusCode: 200, headers, body: JSON.stringify(invoice) };
    }

    // List invoices for a user
    if (action === 'list' && params.user_id) {
      let url = `/rest/v1/creator_invoices?user_id=eq.${params.user_id}&select=*&order=created_at.desc`;
      if (params.status) url += `&status=eq.${params.status}`;
      if (params.limit) url += `&limit=${parseInt(params.limit, 10) || 50}`;

      const res = await supaFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // List clients for a user
    if (action === 'clients' && params.user_id) {
      const res = await supaFetch(`/rest/v1/creator_clients?user_id=eq.${params.user_id}&select=*&order=name`);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // List quotes for a user
    if (action === 'quotes' && params.user_id) {
      let url = `/rest/v1/creator_quotes?user_id=eq.${params.user_id}&select=*&order=created_at.desc`;
      if (params.status) url += `&status=eq.${params.status}`;
      const res = await supaFetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // Get single invoice with items
    if (action === 'get' && params.id) {
      const [invRes, itemsRes] = await Promise.all([
        supaFetch(`/rest/v1/creator_invoices?id=eq.${params.id}&select=*&limit=1`),
        supaFetch(`/rest/v1/creator_invoice_items?invoice_id=eq.${params.id}&order=sort_order`)
      ]);
      const invoices = await invRes.json();
      if (!invoices.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Invoice not found' }) };
      invoices[0].items = await itemsRes.json();
      return { statusCode: 200, headers, body: JSON.stringify(invoices[0]) };
    }

    // Dashboard stats
    if (action === 'stats' && params.user_id) {
      const res = await supaFetch(`/rest/v1/creator_invoices?user_id=eq.${params.user_id}&select=status,total,due_date,paid_date,issued_date`);
      const invoices = await res.json();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let outstanding = 0, paidThisMonth = 0, overdue = 0, overdueCount = 0, payDays = [];
      invoices.forEach(inv => {
        if (inv.status === 'sent' || inv.status === 'viewed') {
          outstanding += inv.total || 0;
          if (inv.due_date && new Date(inv.due_date) < now) {
            overdue += inv.total || 0;
            overdueCount++;
          }
        }
        if (inv.status === 'paid' && inv.paid_date && new Date(inv.paid_date) >= monthStart) {
          paidThisMonth += inv.total || 0;
        }
        if (inv.status === 'paid' && inv.issued_date && inv.paid_date) {
          const days = Math.round((new Date(inv.paid_date) - new Date(inv.issued_date)) / 86400000);
          if (days >= 0) payDays.push(days);
        }
      });

      const avgPayDays = payDays.length ? Math.round(payDays.reduce((a,b) => a + b, 0) / payDays.length) : 0;
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ outstanding, paidThisMonth, overdue, overdueCount, avgPayDays, totalInvoices: invoices.length })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use: list, get, view, clients, quotes, stats' }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function supaFetch(path, options = {}) {
  const url = SUPABASE_URL + path;
  const fetchHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.method === 'PATCH' ? { Prefer: 'return=minimal' } : {})
  };
  return fetch(url, {
    method: options.method || 'GET',
    headers: fetchHeaders,
    body: options.body || undefined
  });
}
