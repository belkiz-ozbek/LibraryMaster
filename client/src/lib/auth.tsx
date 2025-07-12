import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<User>;
  signup: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  testSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'libraryms_user';
const AUTH_CHECKED_KEY = 'libraryms_auth_checked';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from localStorage on initial load
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [hasCheckedAuth, setHasCheckedAuth] = useState(() => {
    // Check if we've already verified auth on this session
    try {
      return localStorage.getItem(AUTH_CHECKED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  
  // Set loading based on whether we've checked auth
  const [isLoading, setIsLoading] = useState(() => {
    // If we haven't checked auth yet, show loading
    try {
      return localStorage.getItem(AUTH_CHECKED_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const checkAuth = useCallback(async () => {
    if (hasCheckedAuth) {
      // If we've already checked auth, don't show loading
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log("[Auth] Checking authentication...");
      
      // First, let's check the debug endpoint
      try {
        const debugResponse = await fetch("/api/debug/auth", {
          credentials: "include",
        });
        const debugData = await debugResponse.json();
        console.log("[Auth] Debug info:", debugData);
      } catch (debugError) {
        console.log("[Auth] Debug endpoint failed:", debugError);
      }
    
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("[Auth] /api/auth/me response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("[Auth] User data received:", data);
        setUser(data.user);
        // Store user in localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } else {
        console.log("[Auth] Authentication failed, status:", response.status);
        setUser(null);
        // Clear user from localStorage
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      // Clear user from localStorage on error
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
      // Mark that we've checked auth in this session
      localStorage.setItem(AUTH_CHECKED_KEY, 'true');
    }
  }, [hasCheckedAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      // Store user in localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, username: string, email: string, password: string) => {
    // This function is now deprecated as signup is handled directly in the signup page
    // Keeping for backward compatibility but it's not used anymore
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Signup failed");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      // Clear user from localStorage
      localStorage.removeItem(USER_STORAGE_KEY);
      // Reset auth check flag
      localStorage.removeItem(AUTH_CHECKED_KEY);
      setHasCheckedAuth(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const testSession = useCallback(async () => {
    try {
      console.log("[TestSession] Testing session...");
      const response = await fetch("/api/debug/auth", {
        credentials: "include",
      });
      const data = await response.json();
      console.log("[TestSession] Debug data:", data);
    } catch (error) {
      console.error("[TestSession] Error:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, checkAuth, testSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
