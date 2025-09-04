import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login({ email, password, remember }) {
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
  }

  async function requestAccess({ name, email, phone, password, gender }) {
    try {
      const { data } = await api.post("/auth/request-access", {
        name,
        email,
        phone,
        password,
        gender,
      });
      toast.success(data.message || "Request submitted");
      return data.user;
    } catch (err) {
      const msg = err?.response?.data?.message || "Request failed";
      toast.error(msg);
      throw err;
    }
  }

  async function logout() {
    try {
      await api.post("/auth/sign-out/web");
    } catch (_) {}
    setUser(null);
    toast.success("Signed out");
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout, requestAccess }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
