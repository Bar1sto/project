// // src/context/AuthContext.jsx
// import { createContext, useContext, useEffect, useMemo, useState } from "react";
// import { api, clearToken, hasToken } from "../lib/api";

// const Ctx = createContext(null);

// export function AuthProvider({ children }) {
//   const [authed, setAuthed] = useState(hasToken());
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     let alive = true;
//     if (!hasToken()) {
//       setAuthed(false);
//       setUser(null);
//       return;
//     }
//     (async () => {
//       try {
//         const me = await api.getMe();
//         if (!alive) return;
//         setUser(me);
//         setAuthed(true);
//       } catch {
//         clearToken();
//         if (!alive) return;
//         setAuthed(false);
//         setUser(null);
//       }
//     })();
//     return () => (alive = false);
//   }, []);

//   const value = useMemo(
//     () => ({
//       authed,
//       user,
//       async login(payload) {
//         const { ok } = await api.login(payload);
//         if (!ok) return { ok: false };
//         try {
//           const me = await api.getMe();
//           setUser(me);
//           setAuthed(true);
//         } catch {
//           // даже если /me не отдался — токен уже есть
//           setAuthed(true);
//         }
//         return { ok: true };
//       },
//       async logout() {
//         clearToken();
//         setUser(null);
//         setAuthed(false);
//       },
//     }),
//     [authed, user]
//   );

//   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// }

// export function useAuth() {
//   return useContext(Ctx);
// }
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const Ctx = createContext({
  authed: false,
  user: null,
  setAuthed: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(api.hasToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (api.hasToken()) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({ authed, setAuthed, user, setUser }),
    [authed, user]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
