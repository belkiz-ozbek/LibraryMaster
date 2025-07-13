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
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'libraryms_user';
const AUTH_CHECKED_KEY = 'libraryms_auth_checked';
const TOKEN_STORAGE_KEY = 'libraryms_token';

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

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const checkAuth = useCallback(async () => {
    if (hasCheckedAuth) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setUser(null);
        setIsLoading(false);
        setHasCheckedAuth(true);
        localStorage.removeItem(USER_STORAGE_KEY);
        return;
      }
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
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
      setToken(data.token);
      // Store user in localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
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
      setUser(null);
      setToken(null);
      // Clear user from localStorage
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, checkAuth, testSession, token }}>
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
