// AppContext.jsx - Enhanced for both backend and demo mode
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

// Set up axios with better error handling
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.timeout = 10000; // 10 second timeout

// Demo products data
const demoProducts = [
  {
    _id: "1",
    name: "Handmade Crochet Blanket",
    description: "Beautiful handmade crochet blanket with soft yarn",
    price: 49.99,
    offerPrice: 39.99,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    category: "blankets",
    inStock: true,
    materials: ["cotton", "wool"]
  },
  {
    _id: "2",
    name: "Crochet Baby Booties",
    description: "Adorable crochet booties for babies",
    price: 19.99,
    offerPrice: 15.99,
    image: "https://images.unsplash.com/photo-1589820296152-8d5e3d3fcbaf?w=400",
    category: "accessories",
    inStock: true,
    materials: ["cotton"]
  },
  {
    _id: "3",
    name: "Vintage Crochet Table Runner",
    description: "Elegant table runner for your dining table",
    price: 34.99,
    offerPrice: 29.99,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    category: "home-decor",
    inStock: true,
    materials: ["linen", "cotton"]
  }
];

// Create the context
export const AppContext = createContext(null);

// Context Provider Component
export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendChecking, setBackendChecking] = useState(true);

  // Check backend connection on app start
  const checkBackendConnection = async () => {
    try {
      setBackendChecking(true);
      const { data } = await axios.get("/api/health");
      setBackendConnected(true);
      console.log("✅ Backend connected successfully");
      return true;
    } catch (error) {
      setBackendConnected(false);
      console.log("❌ Backend not available, using demo mode");
      return false;
    } finally {
      setBackendChecking(false);
    }
  };

  // Enhanced fetchProducts with better fallback
  const fetchProducts = async () => {
    if (!backendConnected) {
      console.log("🔄 Using demo products (backend not connected)");
      setProducts(demoProducts);
      return;
    }

    try {
      console.log("🔄 Attempting to fetch products from backend...");
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
        console.log("✅ Products loaded from backend");
      }
    } catch (error) {
      console.log("❌ Failed to fetch products, using demo data");
      setProducts(demoProducts);
      toast.success("Using demo mode - Backend not available");
    }
  };

  // Enhanced fetchUser with demo mode support
  const fetchUser = async () => {
    if (!backendConnected) {
      console.log("🔄 Using demo user mode");
      // Set a demo user for local testing
      const demoUser = {
        _id: "demo-user",
        name: "Demo User",
        email: "demo@example.com",
        cart: {}
      };
      setUser(demoUser);
      setCartItems(demoUser.cart || {});
      return;
    }

    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cart || {});
      }
    } catch (error) {
      console.log("Failed to fetch user, using demo mode:", error);
      // Don't set demo user here to avoid overriding actual login
    }
  };

  // Enhanced fetchSeller with demo mode
  const fetchSeller = async () => {
    if (!backendConnected) {
      console.log("🔄 Seller demo mode - not authenticated");
      setIsSeller(false);
      return;
    }

    try {
      const { data } = await axios.get("/api/seller/is-auth");
      if (data.success) {
        setIsSeller(true);
        console.log("✅ Seller is authenticated");
      }
    } catch (error) {
      setIsSeller(false);
      console.log("❌ Seller not authenticated");
    }
  };

  // Enhanced seller login with demo mode
  const sellerLogin = async (email, password) => {
    if (!backendConnected) {
      // Demo seller login for testing
      if (email === "demo@seller.com" && password === "demo123") {
        setIsSeller(true);
        toast.success("Demo seller login successful!");
        return { success: true };
      } else {
        toast.error("Demo credentials: demo@seller.com / demo123");
        return { success: false, message: "Use demo credentials" };
      }
    }

    try {
      const { data } = await axios.post("/api/seller/login", {
        email,
        password,
      });
      
      if (data.success) {
        setIsSeller(true);
        toast.success("Seller login successful!");
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Seller login error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        toast.error("Seller login failed - backend not available");
        return { success: false, message: "Backend not available" };
      }
    }
  };

  // Enhanced Google Login
  const googleLogin = async (credentialResponse) => {
    if (!backendConnected) {
      // Demo Google login
      const demoUser = {
        _id: "google-demo-user",
        name: "Google User",
        email: "google@example.com",
        cart: {}
      };
      setUser(demoUser);
      setCartItems(demoUser.cart || {});
      toast.success("Demo Google login successful!");
      return true;
    }

    try {
      const { data } = await axios.post("/api/user/google-auth", {
        token: credentialResponse.credential
      });
      
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cart || {});
        toast.success("Google login successful!");
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
      return false;
    }
  };

  // Enhanced addToCart with demo mode
  const addToCart = (itemId) => {
    if (!user && backendConnected) {
      setShowUserLogin(true);
      toast.error("Please login to add items to cart");
      return;
    }

    let cartData = { ...cartItems };
    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
    toast.success("Added to cart");

    // Only update backend if connected
    if (backendConnected && user) {
      updateCartInBackend(cartData);
    }
  };

  // Update cart in backend (only when connected)
  const updateCartInBackend = async (cartData) => {
    if (!backendConnected || !user) return;
    
    try {
      await axios.post("/api/cart/update", { cartItems: cartData });
    } catch (error) {
      console.error("Failed to update cart in backend:", error);
    }
  };

  // Update cart item quantity
  const updateCartItem = (itemId, quantity) => {
    let cartData = { ...cartItems };
    cartData[itemId] = quantity;
    setCartItems(cartData);
    
    if (backendConnected && user) {
      updateCartInBackend(cartData);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    let cartData = { ...cartItems };
    if (cartData[itemId]) {
      cartData[itemId] -= 1;
      if (cartData[itemId] === 0) {
        delete cartData[itemId];
      }
      setCartItems(cartData);
      toast.success("Removed from cart");
      
      if (backendConnected && user) {
        updateCartInBackend(cartData);
      }
    }
  };

  // Cart count
  const cartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      totalCount += cartItems[item];
    }
    return totalCount;
  };

  // Total cart amount
  const totalCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      const itemInfo = products.find((product) => product._id === itemId);
      if (itemInfo && cartItems[itemId] > 0) {
        totalAmount += cartItems[itemId] * itemInfo.offerPrice;
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  // User login function for demo mode
  const userLogin = async (email, password) => {
    if (!backendConnected) {
      // Demo user login
      if (email === "demo@user.com" && password === "demo123") {
        const demoUser = {
          _id: "demo-user",
          name: "Demo User",
          email: "demo@user.com",
          cart: {}
        };
        setUser(demoUser);
        setCartItems(demoUser.cart || {});
        setShowUserLogin(false);
        toast.success("Demo login successful!");
        return { success: true };
      } else {
        toast.error("Demo credentials: demo@user.com / demo123");
        return { success: false, message: "Use demo credentials" };
      }
    }

    // Actual backend login would go here
    // You can implement this when you have a backend
    toast.error("Backend login not implemented");
    return { success: false, message: "Backend login not available" };
  };

  // Initialize - check backend first, then load data
  useEffect(() => {
    const initializeApp = async () => {
      const connected = await checkBackendConnection();
      if (connected) {
        await fetchSeller();
        await fetchProducts();
        await fetchUser();
      } else {
        // Load demo data immediately if no backend
        fetchProducts();
        fetchUser();
        fetchSeller();
      }
    };

    initializeApp();
  }, []);

  // Update cart in backend when it changes (only when backend is connected)
  useEffect(() => {
    if (backendConnected && user) {
      updateCartInBackend(cartItems);
    }
  }, [cartItems, user, backendConnected]);

  // Context value
  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    cartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    searchQuery,
    setSearchQuery,
    googleLogin,
    cartCount,
    totalCartAmount,
    axios,
    fetchProducts,
    setCartItems,
    backendConnected,
    backendChecking,
    sellerLogin,
    fetchSeller,
    userLogin, // Add this for user login
    checkBackendConnection, // Add this to allow re-checking connection
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
