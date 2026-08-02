import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { friendlyAuthError } from "@/lib/auth-errors";
import { getSupabase, isSupabaseReady } from "@/lib/supabase";
import type { Profile, ProfileUpdate } from "@/types/database";
import { AuthContext, type AuthContextValue } from "./auth-context";

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("[RigScout] profile fetch failed", error);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = isSupabaseReady();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(userId));
  }, [session?.user?.id]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const signUp = useCallback(
    async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw new Error(friendlyAuthError(error));
    },
    [],
  );

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(friendlyAuthError(error));
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate) => {
      const supabase = getSupabase();
      const userId = session?.user?.id;
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      setProfile(data as Profile);
    },
    [session?.user?.id],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready: !loading,
      loading,
      supabaseConfigured,
      session,
      user: session?.user ?? null,
      profile,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      updateProfile,
    }),
    [
      loading,
      supabaseConfigured,
      session,
      profile,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
