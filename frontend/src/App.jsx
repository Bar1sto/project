// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import BigProductPage from "./pages/BigProductPage.jsx";
import Profile from "./components/Profile/Profile.jsx";
import FavoritesPage from "./pages/FavoritesPage/Favorites.jsx";
import CartPage from "./components/Cart/Cart.jsx";
import RequireAuth from "./components/routing/RequireAuth";
import CatalogPage from "./pages/CatalogPage/Catalog.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/product/:slug" element={<BigProductPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
