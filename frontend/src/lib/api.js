// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// хранение токена
const TOKEN_KEY = "access";
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export const api = {
  hasToken: () => !!getToken(),

  // универсальный fetch БЕЗ cookies
  async _fetch(
    path,
    { method = "GET", headers = {}, body, isForm = false } = {}
  ) {
    const token = getToken();
    const h = {
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };
    const res = await fetch(API_BASE + path, {
      method,
      headers: h,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      // КЛЮЧЕВОЕ: не отправляем куки, чтобы сессия админа не «перебивала» JWT
      credentials: "omit",
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    return { ok: res.ok, status: res.status, data: json };
  },

  // ===== AUTH =====
  async login(payload) {
    // 1) твой кастомный логин
    let r = await api._fetch("/clients/login/", {
      method: "POST",
      body: payload,
    });
    // 2) fallback — simplejwt стандарт (если настроен)
    if (!r.ok)
      r = await api._fetch("/auth/jwt/create/", {
        method: "POST",
        body: payload,
      });
    // 3) fallback — dj-rest-auth (если есть)
    if (!r.ok)
      r = await api._fetch("/dj-rest-auth/login/", {
        method: "POST",
        body: payload,
      });

    if (!r.ok) return { ok: false, error: r.data };

    // достаём access
    const access =
      r.data?.access ||
      r.data?.token ||
      r.data?.key ||
      r.data?.data?.access ||
      "";

    if (access) setToken(access);
    return { ok: true };
  },

  async register(payload) {
    const r = await api._fetch("/clients/register/", {
      method: "POST",
      body: payload,
    });

    if (!r.ok) {
      return { ok: false, error: r.data, status: r.status };
    }

    const access =
      r.data?.access ||
      r.data?.token ||
      r.data?.key ||
      r.data?.data?.access ||
      "";
    if (access) setToken(access);

    return { ok: true, data: r.data };
  },

  logout() {
    setToken("");
  },

  // ===== PROFILE/FAVORITES/ORDERS =====
  async getMe() {
    // добавил /clients/me/ как ты просил
    const candidates = [
      "/clients/me/",
      "/customers/me/",
      "/users/me/",
      "/auth/user/",
    ];
    for (const p of candidates) {
      const r = await api._fetch(p);
      if (r.ok && r.data) return r.data;
    }
    throw new Error("me_not_found");
  },

  async updateMe(patch) {
    // пробуем PATCH на возможные варианты
    const paths = ["/clients/me/", "/customers/me/", "/users/me/"];
    for (const p of paths) {
      const r = await api._fetch(p, { method: "PATCH", body: patch });
      if (r.ok) return r.data || patch;
    }
    throw new Error("update_failed");
  },

  async uploadAvatar(file) {
    const fd = new FormData();
    fd.append("avatar", file);
    const paths = [
      "/clients/me/avatar/",
      "/customers/me/avatar/",
      "/users/me/avatar/",
    ];
    for (const p of paths) {
      const r = await api._fetch(p, { method: "POST", isForm: true, body: fd });
      if (r.ok) return r.data?.avatar || r.data?.url || null;
    }
    throw new Error("avatar_upload_failed");
  },

  async getFavorites() {
    const paths = ["/products/favorites/", "/favorites/"];
    for (const p of paths) {
      const r = await api._fetch(p);
      if (r.ok) return r.data?.results || r.data || [];
    }
    return [];
  },

  async getOrders() {
    const paths = ["/orders/", "/orders/history/"];
    for (const p of paths) {
      const r = await api._fetch(p);
      if (r.ok) return r.data?.results || r.data || [];
    }
    return [];
  },

  async repeatOrder(orderId) {
    const r = await api._fetch(`/orders/${orderId}/repeat/`, {
      method: "POST",
    });
    return r.ok;
  },
};

export default api;
