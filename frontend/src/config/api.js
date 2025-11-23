// // src/config/api.js
// // Базовые пути. Делаем абсолютные эндпоинты, чтобы не зависеть от прокси.
// export const API_ORIGIN = ""; // "" = тот же хост, где фронт
// export const API_BASE = ""; // не используем префикс, т.к. пути ниже абсолютные

// // Медиа с Django (/media/). Превращаем относительный путь в абсолютный URL.
// export const MEDIA_PREFIX = "/media/";
// export function toAbsMedia(u = "") {
//   if (!u) return "";
//   if (/^https?:\/\//i.test(u)) return u;
//   const origin = API_ORIGIN || window.location.origin;
//   // если пришел уже с "/" — просто приклеим к origin, иначе считаем, что это относительный путь внутри /media/
//   return origin + (u.startsWith("/") ? u : `${MEDIA_PREFIX}${u}`);
// }

// /**
//  * Эндпоинты под твой проект.
//  * В customers ты инклудишь как `path('api/clients/', include('apps.customers.urls', ...))`
//  * поэтому ставлю первыми варианты на /api/clients/.
//  * Остальные — запасные, если вдруг отличалась конфа.
//  */
// export const ENDPOINTS = {
//   login: [
//     "/api/clients/login/", // SimpleJWT TokenObtainPairView из customers.urls
//     "/api/token/", // запасной путь
//     "/api/token-auth/", // очень запасной :)
//   ],
//   me: [
//     "/api/clients/me/", // твой основной
//     "/api/customers/me/", // если в какой-то ветке включалось иначе
//     "/customers/me/",
//   ],
//   favorites: [
//     "/api/favorites/", // см. urls.py — у тебя favorites висят в проектных urls
//     "/favorites/",
//     "/api/products/favorites/",
//   ],
//   orders: ["/api/orders/", "/orders/"],
//   orderRepeat: [
//     "/api/orders/{id}/repeat/",
//     "/orders/{id}/repeat/",
//     "/api/orders/repeat/{id}/",
//   ],
// };
// src/config/api.js
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
