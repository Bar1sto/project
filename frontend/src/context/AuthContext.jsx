// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(api.hasToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;

    async function boot() {
      // если токена нет (или он был битый и api.js уже его вычистил) — не дергаем /me
      if (!api.hasToken()) {
        if (!alive) return;
        setAuthed(false);
        setUser(null);
        return;
      }

      try {
        const me = await api.getMe();
        if (!alive) return;
        setAuthed(true);
        setUser(me);
      } catch {
        // если токен протух — api.js его очистил на 401, тут просто сбрасываем стейт
        if (!alive) return;
        setAuthed(false);
        setUser(null);
      }
    }

    boot();
    return () => {
      alive = false;
    };
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
