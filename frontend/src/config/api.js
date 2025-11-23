export const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://127.0.0.1:8000/api";

export const MEDIA_BASE =
  (import.meta.env && import.meta.env.VITE_MEDIA_BASE) ||
  "http://127.0.0.1:8000";

export const ENDPOINTS = {
  // логин: сперва твой кастомный, потом типовые варианты
  login: ["/clients/login/", "/auth/jwt/create/", "/dj-rest-auth/login/"],
  register: ["/clients/register/", "/auth/register/"],
  me: ["/customers/me/", "/clients/me/", "/users/me/", "/auth/user/"],
  favorites: ["/products/favorites/", "/favorites/"],
  orders: ["/orders/", "/orders/history/"],
  avatar: ["/customers/avatar/", "/clients/avatar/"], // PATCH/POST c FormData {avatar: file}
  updateMe: ["/customers/me/", "/clients/me/"], // PATCH профиля
  repeatOrder: (id) => `/orders/${id}/repeat/`,
};

export function toAbsMedia(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return MEDIA_BASE.replace(/\/$/, "") + "/" + String(url).replace(/^\//, "");
}
