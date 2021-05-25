import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let item = cart.find((item) => item.id === productId);
      if (!item) {
        const { data } = await api.get<Product>(`/products/${productId}`);
        item = { ...data, amount: 0 };
      }

      const { data } = await api.get<Stock>(`/stock/${productId}`);

      if (data.amount < item.amount + 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateCart = [
        ...cart.filter((item) => item.id !== productId),
        { ...item, amount: item.amount + 1 },
      ];
      setCart(updateCart);
      return localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(updateCart)
      );
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const item = cart.find((item) => item.id === productId);
      if (!item) throw new Error();
      const updateCart = [
        ...cart.filter((item) => item.id !== productId),
        { ...item, amount: item.amount - 1 },
      ];
      setCart(updateCart);
      return localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(updateCart)
      );
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const item = cart.find((item) => item.id === productId);
      if (!item) throw new Error();

      const { data } = await api.get<Stock>(`/stock/${productId}`);

      if (data.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      const updateCart = [
        ...cart.filter((item) => item.id !== productId),
        { ...item, amount },
      ];
      setCart(updateCart);
      return localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(updateCart)
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
