// AppContext.jsx - Real-time Backend Focused
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

// Smart backend URL configuration
const getBackendConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const customBackendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Priority: Custom URL > Default production URL > Localhost for development
  if (customBackendUrl) {
    return customBackendUrl;
  }
  
  if (isDevelopment) {
    return "http://localhost:5000";
  }
  
  // Return empty string in production if no backend URL is set
  // This will cause backend checks to fail gracefully
  return "";
};

const BACKEND_URL = getBackendConfig();

// Configure axios
if (BACKEND_URL) {
  axios.defaults.baseURL = BACKEND_URL;
}
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.withCredentials = true;

console.log("🚀 App Configuration:");
console.log("🔧 Environment:", import.meta.env.MODE);
console.log("🔧 Backend URL:", BACKEND_URL || "Not configured");

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
  const [loading, setLoading] = useState(true);

  // Enhanced backend connection check
  const checkBackendConnection = async () => {
    // If no backend URL is configured, mark as disconnected
    if (!BACKEND_URL) {
      console.log("❌ No backend URL configured");
      setBackendConnected(false);
      setBackendChecking(false);
      return false;
    }

    try {
      setBackendChecking(true);
      console.log("🔍 Checking backend connection at:", BACKEND_URL);
      
      const { data } = await axios.get("/api/health", {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      setBackendConnected(true);
      console.log("✅ Backend connected successfully");
      return true;
    } catch (error) {
      setBackendConnected(false);
      console.log("❌ Backend connection failed:", error.message);
      
      // Show appropriate error message based on error type
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        toast.error("Backend server is not available");
      } else if (error.response) {
        console.log("Backend responded with error:", error.response.status);
      }
      
      return false;
    } finally {
      setBackendChecking(false);
    }
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!backendConnected) {
      console.log("📦 Cannot fetch products - backend not connected");
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Fetching products from backend...");
      
      const { data } = await axios.get("/api/product/list");
      
      if (data.success && data.products) {
        setProducts(data.products);
        console.log(`✅ Loaded ${data.products.length} products from backend`);
      } else {
        console.log("❌ No products received from backend");
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch products:", error.message);
      setProducts([]);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data from backend
  const fetchUser = async () => {
    if (!backendConnected) {
      console.log("👤 Cannot fetch user - backend not connected");
      return;
    }

    try {
      const { data } = await axios.get("/api/user/is-auth");
      
      if (data.success && data.user) {
        setUser(data.user);
        setCartItems(data.user.cart || {});
        console.log("✅ User authenticated:", data.user.email);
      }
    } catch (error) {
      console.log("❌ User not authenticated or backend error:", error.message);
      // Don't clear user here as they might be logged in but backend is temporarily down
    }
  };

  // Fetch seller status from backend
  const fetchSeller = async () => {
    if (!backendConnected) {
      console.log("🏪 Cannot fetch seller status - backend not connected");
      setIsSeller(false);
      return;
    }

    try {
      const { data } = await axios.get("/api/seller/is-auth");
      
      if (data.success) {
        setIsSeller(true);
        console.log("✅ Seller authenticated");
      } else {
        setIsSeller(false);
        console.log("❌ Seller not authenticated");
      }
    } catch (error) {
      console.log("❌ Failed to fetch seller status:", error.message);
      setIsSeller(false);
    }
  };

  // Seller login with backend
  const sellerLogin = async (email, password) => {
    if (!backendConnected) {
      toast.error("Backend not available. Please check server connection.");
      return { success: false, message: "Backend not available" };
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
        toast.error(data.message || "Login failed");
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Seller login error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        toast.error("Login failed - server error");
        return { success: false, message: "Server error" };
      }
    }
  };

  // Google Login with backend
  const googleLogin = async (credentialResponse) => {
    if (!backendConnected) {
      toast.error("Backend not available. Please check server connection.");
      return false;
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
        toast.error(data.message || "Google login failed");
        return false;
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed");
      return false;
    }
  };

  // User registration with backend
  const userRegister = async (userData) => {
    if (!backendConnected) {
      toast.error("Backend not available. Please check server connection.");
      return { success: false, message: "Backend not available" };
    }

    try {
      const { data } = await axios.post("/api/user/register", userData);
      
      if (data.success) {
        setUser(data.user);
        toast.success("Registration successful!");
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        toast.error("Registration failed");
        return { success: false, message: "Registration failed" };
      }
    }
  };

  // User login with backend
  const userLogin = async (email, password) => {
    if (!backendConnected) {
      toast.error("Backend not available. Please check server connection.");
      return { success: false, message: "Backend not available" };
    }

    try {
      const { data } = await axios.post("/api/user/login", {
        email,
        password,
      });
      
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cart || {});
        setShowUserLogin(false);
        toast.success("Login successful!");
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        toast.error("Login failed");
        return { success: false, message: "Login failed" };
      }
    }
  };

  // User logout
  const userLogout = async () => {
    if (backendConnected) {
      try {
        await axios.post("/api/user/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    setUser(null);
    setCartItems({});
    setIsSeller(false);
    toast.success("Logged out successfully");
  };

  // Add to cart with backend sync
  const addToCart = async (itemId) => {
    if (!user) {
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

    // Sync with backend if connected
    if (backendConnected) {
      try {
        await axios.post("/api/cart/update", { cartItems: cartData });
      } catch (error) {
        console.error("Failed to update cart in backend:", error);
        toast.error("Cart updated locally but failed to sync with server");
      }
    }
  };

  // Update cart item quantity with backend sync
  const updateCartItem = async (itemId, quantity) => {
    let cartData = { ...cartItems };
    cartData[itemId] = quantity;
    setCartItems(cartData);
    
    // Sync with backend if connected
    if (backendConnected && user) {
      try {
        await axios.post("/api/cart/update", { cartItems: cartData });
      } catch (error) {
        console.error("Failed to update cart in backend:", error);
      }
    }
  };

  // Remove from cart with backend sync
  const removeFromCart = async (itemId) => {
    let cartData = { ...cartItems };
    if (cartData[itemId]) {
      cartData[itemId] -= 1;
      if (cartData[itemId] === 0) {
        delete cartData[itemId];
      }
      setCartItems(cartData);
      toast.success("Removed from cart");
      
      // Sync with backend if connected
      if (backendConnected && user) {
        try {
          await axios.post("/api/cart/update", { cartItems: cartData });
        } catch (error) {
          console.error("Failed to update cart in backend:", error);
        }
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
        totalAmount += cartItems[itemId] * (itemInfo.offerPrice || itemInfo.price);
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  // Refresh backend connection
  const refreshBackendConnection = async () => {
    const connected = await checkBackendConnection();
    if (connected) {
      await fetchProducts();
      await fetchUser();
      await fetchSeller();
    }
    return connected;
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      const connected = await checkBackendConnection();
      if (connected) {
        // Load all data from backend
        await Promise.all([
          fetchProducts(),
          fetchUser(),
          fetchSeller()
        ]);
      } else {
        setLoading(false);
        toast.error("Backend server not available. Please check your connection.");
      }
    };

    initializeApp();
  }, []);

  // Context value
  const value = {
    // State
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    cartItems,
    searchQuery,
    setSearchQuery,
    backendConnected,
    backendChecking,
    loading,
    
    // Auth functions
    googleLogin,
    sellerLogin,
    userLogin,
    userRegister,
    userLogout,
    fetchSeller,
    
    // Cart functions
    addToCart,
    updateCartItem,
    removeFromCart,
    cartCount,
    totalCartAmount,
    
    // Data functions
    fetchProducts,
    setCartItems,
    
    // Backend functions
    refreshBackendConnection,
    checkBackendConnection,
    
    // Axios instance for direct API calls
    axios,
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
