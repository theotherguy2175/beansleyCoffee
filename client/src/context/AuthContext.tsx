import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PublicUser } from "@/types/api";

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (email: string, password: string, name: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await api.get<PublicUser>("/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });

  async function login(email: string, password: string) {
    const loggedInUser = await api.post<PublicUser>("/auth/login", { email, password });
    queryClient.setQueryData(["auth", "me"], loggedInUser);
    return loggedInUser;
  }

  async function register(email: string, password: string, name: string) {
    const newUser = await api.post<PublicUser>("/auth/register", { email, password, name });
    queryClient.setQueryData(["auth", "me"], newUser);
    return newUser;
  }

  async function logout() {
    await api.post("/auth/logout");
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
