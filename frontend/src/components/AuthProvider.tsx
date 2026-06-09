"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for token on mount
    const token = localStorage.getItem("optimus_token");
    if (token) {
      setIsAuthenticated(true);
      // Redirect away from login or landing page if already logged in
      if (pathname === "/login" || pathname === "/") {
        router.push("/dashboard");
      }
    } else {
      setIsAuthenticated(false);
      // Redirect to login if not authenticated and not already on login page or landing page
      if (pathname !== "/login" && pathname !== "/") {
        router.push("/login");
      }
    }
    setIsChecking(false);
  }, [pathname, router]);

  const login = (token: string) => {
    localStorage.setItem("optimus_token", token);
    setIsAuthenticated(true);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("optimus_token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  if (isChecking) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;
  }

  // If not authenticated and not on login page or landing page, don't render children to prevent flicker
  if (!isAuthenticated && pathname !== "/login" && pathname !== "/") {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
