import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setLocation("/login");
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}

