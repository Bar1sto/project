import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../lib/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });

  const refreshCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      const total = Number.parseFloat(data?.total);
      setCart({
        items: Array.isArray(data?.items) ? data.items : [],
        total: Number.isFinite(total) ? total : 0,
      });
    } catch {
      setCart({ items: [], total: 0 });
    }
  }, []);

  // qty map в памяти
  const qtyByVariant = useMemo(() => {
    const m = {};
    for (const it of cart.items) {
      const id = Number(it.variant_id);
      if (!Number.isFinite(id)) continue;
      m[id] = Number(it.qty) || 0;
    }
    return m;
  }, [cart.items]);

  const qtyForVariant = useCallback(
    (variantId) => qtyByVariant[Number(variantId)] ?? 0,
    [qtyByVariant]
  );

  // единая точка изменения количества
  const setQty = useCallback(
    async (variantId, qty) => {
      await api.setCartItem(variantId, qty);
      // api.setCartItem уже диспатчит cart:changed, но мы и сами обновим сразу
      await refreshCart();
    },
    [refreshCart]
  );

  useEffect(() => {
    refreshCart();
    const onChanged = () => refreshCart();
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems: cart.items,
        cartTotal: cart.total,
        qtyForVariant,
        refreshCart,
        setQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
