import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      // console.log(products);

      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarket:productsInCart',
      );

      storagedProducts && setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const isItemPresent = products.findIndex(item => item.id === product.id);

      if (isItemPresent < 0) {
        const formattedProduct = { ...product, quantity: 1 };
        setProducts([...products, formattedProduct]);
      } else {
        const formattedProducts = [
          ...products.map((item: Product) => {
            return {
              id: item.id,
              title: item.title,
              price: item.price,
              image_url: item.image_url,
              quantity:
                item.id === product.id ? item.quantity + 1 : item.quantity,
            };
          }),
        ];
        setProducts([...formattedProducts]);
      }

      await AsyncStorage.setItem(
        '@GoMarket:productsInCart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      const formattedProducts = products;
      formattedProducts[productIndex].quantity += 1;

      setProducts([...formattedProducts]);

      await AsyncStorage.setItem(
        '@GoMarket:productsInCart',
        JSON.stringify(formattedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // THIS KEEPS ITEMS IN THE CART WITH MINIMUM OF 1 ITEM
      // const productIndex = products.findIndex(item => item.id === id);
      // if (products[productIndex].quantity <= 1) {

      // } else {
      //   const formattedProducts = products;
      //   formattedProducts[productIndex].quantity -= 1;

      //   setProducts([...formattedProducts]);
      // }

      // THIS REMOVES ITEMS FROM THE CART WHEN REACHING 0 ITEMS
      const productIndex = products.findIndex(item => item.id === id);
      const formattedProducts = products;

      if (products[productIndex].quantity <= 1) {
        formattedProducts.splice(productIndex, 1);
      } else {
        formattedProducts[productIndex].quantity -= 1;
      }
      setProducts([...formattedProducts]);

      await AsyncStorage.setItem(
        '@GoMarket:productsInCart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
