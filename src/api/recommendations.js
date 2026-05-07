export function generateSessionId() {
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

export async function fetchRecommendations(limit = 100, nocodbToken = '') {
  const headers = nocodbToken ? { 'x-nocodb-token': nocodbToken } : {};
  const res = await fetch(`/api/recommendations?limit=${limit}`, { credentials: 'include', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 404) return { data: [], notConfigured: true };
    throw new Error(err.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return { data: data.data || [], notConfigured: false };
}

export async function createRecommendations(records, nocodbToken = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (nocodbToken) headers['x-nocodb-token'] = nocodbToken;
  const res = await fetch('/api/recommendations', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function deleteRecommendation(id, nocodbToken = '') {
  const headers = nocodbToken ? { 'x-nocodb-token': nocodbToken } : {};
  const res = await fetch(`/api/recommendations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function updateRecommendation(id, { Estado, Nota_Cliente }, nocodbToken = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (nocodbToken) headers['x-nocodb-token'] = nocodbToken;
  const res = await fetch(`/api/recommendations/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify({ Estado, Nota_Cliente }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}
