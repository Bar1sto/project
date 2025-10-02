import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            #77 Hockey
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:underline">Главная</Link>
            <a href="/api/docs" className="hover:underline">API</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* тут дальше добавим остальные страницы */}
        </Routes>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} Хоккейный магазин #77
        </div>
      </footer>
    </div>
  );
}