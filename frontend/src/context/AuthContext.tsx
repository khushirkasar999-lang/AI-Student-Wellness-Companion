import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { authApi, type AuthUser, type Profile } from "../api";

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null); // eslint-disable-line react-refresh/only-export-components

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasToken =
    typeof localStorage !== "undefined" && !!localStorage.getItem("token");

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: hasToken,
  });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    authApi
      .me()
      .then(({ user, profile }) => {
        if (mounted.current) setState({ user, profile, loading: false });
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (mounted.current) setState({ user: null, profile: null, loading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem("token", token);
    const { profile } = await authApi.me();
    setState({ user, profile, loading: false });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.register(email, password);
    localStorage.setItem("token", token);
    setState({ user, profile: null, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem("token");
    setState({ user: null, profile: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { user, profile } = await authApi.me();
    setState((s) => ({ ...s, user, profile }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
