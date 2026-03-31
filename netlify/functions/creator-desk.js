// netlify/functions/creator-desk.js
// API for CreatorDesk — project & client persistence
// Uses Supabase Data instance

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${options.token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

async function getUser(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return { id: user.id, token };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const user = await getUser(event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    const path = event.path.replace('/.netlify/functions/creator-desk', '').replace(/^\//, '');
    const method = event.httpMethod;

    // ── PROJECTS ──

    // GET /creator-desk/projects
    if (method === 'GET' && path === 'projects') {
      const projects = await supabaseFetch(
        `creator_projects?user_id=eq.${user.id}&order=updated_at.desc`,
        { method: 'GET', token: user.token }
      );
      return { statusCode: 200, headers, body: JSON.stringify(projects) };
    }

    // POST /creator-desk/projects
    if (method === 'POST' && path === 'projects') {
      const body = JSON.parse(event.body || '{}');
      const result = await supabaseFetch('creator_projects', {
        method: 'POST', token: user.token,
        body: JSON.stringify({
          user_id: user.id,
          name: body.name,
          client_id: body.clientId || null,
          status: body.status || 'lead',
          priority: body.priority || 'medium',
          value: body.value ? parseInt(body.value) : null,
          currency: body.currency || 'NGN',
          due_date: body.due || null,
          description: body.description || ''
        })
      });
      return { statusCode: 201, headers, body: JSON.stringify(result[0] || result) };
    }

    // PATCH /creator-desk/projects/:id
    if (method === 'PATCH' && path.startsWith('projects/')) {
      const projectId = path.replace('projects/', '');
      const body = JSON.parse(event.body || '{}');
      const updates = { updated_at: new Date().toISOString() };
      if (body.status !== undefined) updates.status = body.status;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.name !== undefined) updates.name = body.name;
      if (body.due !== undefined) updates.due_date = body.due;
      if (body.value !== undefined) updates.value = body.value ? parseInt(body.value) : null;
      if (body.status === 'completed') updates.completed_date = new Date().toISOString().split('T')[0];

      const result = await supabaseFetch(
        `creator_projects?id=eq.${projectId}&user_id=eq.${user.id}`,
        { method: 'PATCH', token: user.token, body: JSON.stringify(updates) }
      );
      return { statusCode: 200, headers, body: JSON.stringify(result[0] || result) };
    }

    // DELETE /creator-desk/projects/:id
    if (method === 'DELETE' && path.startsWith('projects/')) {
      const projectId = path.replace('projects/', '');
      await supabaseFetch(
        `creator_projects?id=eq.${projectId}&user_id=eq.${user.id}`,
        { method: 'DELETE', token: user.token, prefer: 'return=minimal' }
      );
      return { statusCode: 204, headers, body: '' };
    }

    // ── TASKS ──

    // GET /creator-desk/tasks/:projectId
    if (method === 'GET' && path.startsWith('tasks/')) {
      const projectId = path.replace('tasks/', '');
      const tasks = await supabaseFetch(
        `creator_project_tasks?project_id=eq.${projectId}&order=sort_order.asc`,
        { method: 'GET', token: user.token }
      );
      return { statusCode: 200, headers, body: JSON.stringify(tasks) };
    }

    // POST /creator-desk/tasks
    if (method === 'POST' && path === 'tasks') {
      const body = JSON.parse(event.body || '{}');
      const result = await supabaseFetch('creator_project_tasks', {
        method: 'POST', token: user.token,
        body: JSON.stringify({
          project_id: body.projectId,
          description: body.description,
          sort_order: body.sortOrder || 0
        })
      });
      return { statusCode: 201, headers, body: JSON.stringify(result[0] || result) };
    }

    // ── CLIENTS ──

    // GET /creator-desk/clients
    if (method === 'GET' && path === 'clients') {
      const clients = await supabaseFetch(
        `creator_clients?user_id=eq.${user.id}&order=name.asc`,
        { method: 'GET', token: user.token }
      );
      return { statusCode: 200, headers, body: JSON.stringify(clients) };
    }

    // POST /creator-desk/clients
    if (method === 'POST' && path === 'clients') {
      const body = JSON.parse(event.body || '{}');
      const result = await supabaseFetch('creator_clients', {
        method: 'POST', token: user.token,
        body: JSON.stringify({
          user_id: user.id,
          name: body.name,
          company: body.company || '',
          email: body.email || '',
          phone: body.phone || '',
          whatsapp: body.whatsapp || '',
          country: body.country || '',
          notes: body.notes || ''
        })
      });
      return { statusCode: 201, headers, body: JSON.stringify(result[0] || result) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('creator-desk error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
