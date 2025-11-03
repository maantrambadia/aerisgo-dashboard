/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { toast } from "sonner";
import api from "@/lib/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async ({ email, password, remember }) => {
      try {
        const { data } = await api.post("/auth/sign-in/web", {
          email,
          password,
          remember,
        });
        toast.success(data.message || "Logged in");
        await refresh();
        return data.user;
      } catch (err) {
        const msg = err?.response?.data?.message || "Login failed";
        toast.error(msg);
        throw err;
      }
    },
    [refresh]
  );

  const requestAccess = useCallback(
    async ({ name, email, phone, password, gender }) => {
      try {
        const { data } = await api.post("/auth/request-access", {
          name,
          email,
          phone,
          password,
          gender,
        });
        // Toast is shown in RequestAccess.jsx component
        return data.user;
      } catch (err) {
        const msg = err?.response?.data?.message || "Request failed";
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/sign-out/web");
    } catch {
      // Ignore errors during logout
    }
    setUser(null);
    toast.success("Signed out");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout, requestAccess }),
    [user, loading, refresh, login, logout, requestAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
