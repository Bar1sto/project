// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// ===== TOKEN =====
const TOKEN_KEY = "access";
const REFRESH_KEY = "refresh";

function isLikelyJwt(token) {
  return (
    typeof token === "string" &&
    /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)
  );
}

export function getToken() {
  const t = localStorage.getItem(TOKEN_KEY) || "";
  return isLikelyJwt(t) ? t : "";
}

export function setToken(t) {
  if (isLikelyJwt(t)) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getRefresh() {
  return localStorage.getItem(REFRESH_KEY) || "";
}

export function setRefresh(t) {
  if (t) localStorage.setItem(REFRESH_KEY, t);
  else localStorage.removeItem(REFRESH_KEY);
}

// ===== ANON ID (не обязательно, но оставим как было) =====
const ANON_KEY = "anon_id";
function getAnonId() {
  let v = localStorage.getItem(ANON_KEY);
  if (!v) {
    v =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(ANON_KEY, v);
  }
  return v;
}

function buildUrl(path) {
  return API_BASE + path;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  hasToken: () => !!getToken(),

  async _fetch(
    path,
    { method = "GET", headers = {}, body, isForm = false } = {}
  ) {
    const token = getToken();

    const doFetch = async (withAuth) => {
      const h = {
        Accept: "application/json",
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        "X-Anon-Id": getAnonId(),
        ...(withAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      };

      const res = await fetch(buildUrl(path), {
        method,
        headers: h,
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
        credentials: "omit",
      });

      const data = await parseJsonSafe(res);
      return { ok: res.ok, status: res.status, data };
    };

    // 1) пробуем с токеном
    let r = await doFetch(true);

    // 2) если 401 — пробуем refresh и повторяем
    if (token && r.status === 401) {
      const refreshed = await api.refreshToken();
      if (refreshed) r = await doFetch(true);
      else {
        setToken("");
        setRefresh("");
        r = await doFetch(false);
      }
    }

    return r;
  },

  // ===== AUTH =====
  async login(payload) {
    const r = await api._fetch("/clients/login/", {
      method: "POST",
      body: payload,
    });
    if (!r.ok) return { ok: false, error: r.data, status: r.status };

    if (r.data?.access) setToken(r.data.access);
    if (r.data?.refresh) setRefresh(r.data.refresh);

    return { ok: true, data: r.data };
  },

  async register(payload) {
    const r = await api._fetch("/clients/register/", {
      method: "POST",
      body: payload,
    });
    if (!r.ok) return { ok: false, error: r.data, status: r.status };

    if (r.data?.access) setToken(r.data.access);
    if (r.data?.refresh) setRefresh(r.data.refresh);

    return { ok: true, data: r.data };
  },

  async refreshToken() {
    const refresh = getRefresh();
    if (!refresh) return false;

    const r = await api._fetch("/clients/refresh/", {
      method: "POST",
      body: { refresh },
    });

    if (!r.ok || !r.data?.access) return false;
    setToken(r.data.access);
    if (r.data?.refresh) setRefresh(r.data.refresh);
    return true;
  },

  logout() {
    setToken("");
    setRefresh("");
  },

  // ===== ME =====
  async getMe() {
    const r = await api._fetch("/clients/me/");
    if (r.ok && r.data) return r.data;
    throw new Error("me_not_found");
  },

  async uploadAvatar(file) {
    const fd = new FormData();
    fd.append("image", file);

    const r = await api._fetch("/clients/me/", {
      method: "PATCH",
      isForm: true,
      body: fd,
    });

    if (!r.ok) throw new Error("avatar_upload_failed");
    return r.data?.image || r.data?.avatar || null;
  },

  // ===== PRODUCTS =====
  async getProducts(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      qs.set(k, String(v));
    });
    const path = qs.toString() ? `/products/?${qs}` : "/products/";
    const r = await api._fetch(path);
    if (!r.ok) throw new Error(`products_${r.status}`);
    return r.data;
  },

  async getProduct(slug) {
    const r = await api._fetch(`/products/${encodeURIComponent(slug)}/`);
    if (r.ok && r.data) return r.data;
    throw new Error("product_not_found");
  },

  // ===== FAVORITES =====
  // фронт зовёт /api/favorites/, vite перепишет на /favorites/ на бэке
  async getFavorites() {
    const r = await api._fetch("/favorites/");
    if (!r.ok) return [];
    return r.data?.results || r.data || [];
  },

  async addFavorite(slug) {
    const r = await api._fetch(`/favorites/${encodeURIComponent(slug)}/`, {
      method: "PUT",
    });
    return r.ok;
  },

  async removeFavorite(slug) {
    const r = await api._fetch(`/favorites/${encodeURIComponent(slug)}/`, {
      method: "DELETE",
    });
    return r.ok;
  },

  // ===== CART =====
  async getCart() {
    const r = await api._fetch("/orders/");
    if (!r.ok) throw new Error("cart_get_" + r.status);
    return r.data || { items: [], total: "0.00" };
  },

  async setCartItem(variantId, qty) {
    const r = await api._fetch("/orders/items/", {
      method: "POST",
      body: { variant_id: variantId, qty },
    });
    if (!r.ok) throw new Error(`cart_set_${r.status}`);
    window.dispatchEvent(new CustomEvent("cart:changed")); // ✅
    return r.data;
  },

  async deleteCartItem(variantId) {
    const r = await api._fetch(`/orders/items/${variantId}/`, {
      method: "DELETE",
    });
    if (r.ok) window.dispatchEvent(new CustomEvent("cart:changed")); // ✅
    return r.ok;
  },

  // === Т-банк: инициализация платежа для текущей draft-корзины ===
  async initPayment(payload) {
    const r = await api._fetch("/payments/init/", {
      method: "POST",
      body: payload,
    });

    if (!r.ok) {
      const detail =
        r.data && (r.data.detail || r.data.error || r.data.message);
      throw new Error(detail || `pay_init_${r.status}`);
    }

    return r.data;
  },
};

export default api;
