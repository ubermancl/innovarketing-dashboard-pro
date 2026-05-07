// Genera un ID único por sesión de análisis para agrupar los insights de una corrida
export function generateSessionId() {
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

export async function fetchRecommendations(limit = 100) {
  const res = await fetch(`/api/recommendations?limit=${limit}`, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // 404 = tabla no configurada aún — no es un error fatal
    if (res.status === 404) return { data: [], notConfigured: true };
    throw new Error(err.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return { data: data.data || [], notConfigured: false };
}

// Guarda todos los registros de una sesión de análisis en NocoDB.
// body es un array de objetos con los campos de la tabla.
export async function createRecommendations(records) {
  const res = await fetch('/api/recommendations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

// Actualiza el estado o nota de una recomendación individual
export async function updateRecommendation(id, { Estado, Nota_Cliente }) {
  const res = await fetch(`/api/recommendations/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Estado, Nota_Cliente }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}
