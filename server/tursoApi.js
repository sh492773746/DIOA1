import 'dotenv/config';

async function parseJsonSafe(res) {
  try { return await res.json(); } catch { return null; }
}

function parseDbNameFromUrl(branchUrl) {
  try {
    if (!branchUrl) return null;
    const org = process.env.TURSO_ORG || '';
    const u = new URL(branchUrl);
    const host = u.hostname || '';
    if (!host) return null;
    if (org && host.includes(`-${org}.`)) {
      return host.split(`-${org}.`)[0];
    }
    const firstDot = host.indexOf('.');
    const first = firstDot > 0 ? host.slice(0, firstDot) : host;
    const parts = first.split('-');
    if (parts.length >= 2) {
      return parts.slice(0, 2).join('-');
    }
    return first;
  } catch {
    return null;
  }
}

export async function listAllDatabases() {
  const apiToken = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG;
  if (!apiToken) return [];
  const headers = { Authorization: `Bearer ${apiToken}` };

  async function fetchAll(baseUrl) {
    const out = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}&page_size=${pageSize}`;
      const r = await fetch(url, { headers });
      if (!r.ok) break;
      const j = await parseJsonSafe(r);
      const arr = Array.isArray(j?.databases) ? j.databases : (Array.isArray(j) ? j : []);
      out.push(...arr);
      const totalPages = j?.pagination?.total_pages;
      if (totalPages && page < totalPages) { page++; continue; }
      if (!totalPages && arr.length === pageSize) { page++; continue; }
      break;
    }
    return out;
  }

  try {
    if (org) {
      const arr = await fetchAll(`https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases`);
      if (arr.length) return arr.map(d => ({ name: d?.Name || d?.name, hostname: d?.Hostname || d?.hostname })).filter(x => x.name && x.hostname);
    }
  } catch {}
  try {
    const arr = await fetchAll('https://api.turso.tech/v1/databases');
    return arr.map(d => ({ name: d?.Name || d?.name, hostname: d?.Hostname || d?.hostname })).filter(x => x.name && x.hostname);
  } catch {}
  return [];
}

export async function createBranch({ dbName, branchName, region }) {
  const apiToken = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG;
  if (!apiToken || !dbName || !branchName) {
    return { ok: false, error: 'missing-config' };
  }
  const headers = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' };

  async function listDatabases() {
    if (org) {
      try {
        const r = await fetch(`https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases?page=1&page_size=100`, { headers });
        if (r.ok) return await parseJsonSafe(r);
      } catch {}
    }
    try {
      const r2 = await fetch('https://api.turso.tech/v1/databases?page=1&page_size=100', { headers });
      if (r2.ok) return await parseJsonSafe(r2);
    } catch {}
    return null;
  }

  function extractLibsqlUrlFromList(list, name) {
    if (!list) return null;
    const arr = Array.isArray(list.databases) ? list.databases : (Array.isArray(list) ? list : []);
    const found = arr.find(d => d?.Name === name || d?.name === name);
    const host = found?.Hostname || found?.hostname || null;
    if (host) return `libsql://${host}`;
    const url = found?.connection_urls?.libsql || found?.libsql_url || found?.url || null;
    return url || null;
  }

  try {
    try {
      const body = { name: branchName, seed: { type: 'database', name: dbName }, group: 'default' };
      if (region) body.location = region;
      const res = await fetch('https://api.turso.tech/v1/databases', { method: 'POST', headers, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await parseJsonSafe(res) || {};
        let url = data?.connection_urls?.libsql || data?.libsql_url || data?.url || null;
        if (!url) {
          const host = data?.database?.Hostname || data?.Hostname || data?.database?.hostname || data?.hostname;
          if (host) url = `libsql://${host}`;
        }
        return { ok: true, branchUrl: url || null, raw: data };
      }
    } catch {}

    if (org) {
      const body = { name: branchName, seed: { type: 'database', name: dbName }, group: 'default' };
      if (region) body.location = region;
      const res = await fetch(`https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases`, {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await parseJsonSafe(res) || {};
        let url = data?.connection_urls?.libsql || data?.libsql_url || data?.url || null;
        if (!url) {
          const host = data?.database?.Hostname || data?.Hostname || data?.database?.hostname || data?.hostname;
          if (host) url = `libsql://${host}`;
        }
        return { ok: true, branchUrl: url || null, raw: data };
      }
      const list = await listDatabases();
      const existing = extractLibsqlUrlFromList(list, branchName);
      if (existing) return { ok: true, branchUrl: existing, raw: list };
    }

    const res2 = await fetch(`https://api.turso.tech/v1/databases/${encodeURIComponent(dbName)}/branches`, {
      method: 'POST', headers,
      body: JSON.stringify(region ? { name: branchName, region } : { name: branchName })
    });
    if (!res2.ok) {
      const text = await res2.text();
      const list = await listDatabases();
      const existing = extractLibsqlUrlFromList(list, branchName);
      if (existing) return { ok: true, branchUrl: existing, raw: list };
      return { ok: false, error: `api-failed:${res2.status}`, details: text };
    }
    const data2 = await parseJsonSafe(res2) || {};
    let url2 = data2?.connection_urls?.libsql || data2?.libsql_url || data2?.url || null;
    if (!url2) {
      const host2 = data2?.database?.Hostname || data2?.Hostname || data2?.database?.hostname || data2?.hostname;
      if (host2) url2 = `libsql://${host2}`;
    }
    return { ok: true, branchUrl: url2 || null, raw: data2 };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function deleteDatabaseByUrl(branchUrl) {
  const apiToken = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG;
  if (!apiToken) return { ok: false, error: 'missing-config' };
  const headers = { Authorization: `Bearer ${apiToken}` };
  const name = parseDbNameFromUrl(branchUrl);
  if (!name) return { ok: false, error: 'invalid-branch-url' };
  try {
    if (org) {
      const r = await fetch(`https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases/${encodeURIComponent(name)}`, { method: 'DELETE', headers });
      if (r.ok || r.status === 404) return { ok: true };
    }
    const r2 = await fetch(`https://api.turso.tech/v1/databases/${encodeURIComponent(name)}`, { method: 'DELETE', headers });
    if (r2.ok || r2.status === 404) return { ok: true };
    const t = await r2.text();
    return { ok: false, error: `api-failed:${r2.status}`, details: t };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function deleteDatabaseByName(name) {
  const apiToken = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG;
  if (!apiToken || !name) return { ok: false, error: 'missing-config' };
  const headers = { Authorization: `Bearer ${apiToken}` };
  try {
    if (org) {
      const r = await fetch(`https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases/${encodeURIComponent(name)}`, { method: 'DELETE', headers });
      if (r.ok || r.status === 404) return { ok: true };
    }
    const r2 = await fetch(`https://api.turso.tech/v1/databases/${encodeURIComponent(name)}`, { method: 'DELETE', headers });
    if (r2.ok || r2.status === 404) return { ok: true };
    const t = await r2.text();
    return { ok: false, error: `api-failed:${r2.status}`, details: t };
  } catch (e) {
    return { ok: false, error: e.message };
  }
} 