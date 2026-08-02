import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";
import type { Profile, ProfileUpdate } from "@/types/database";

export type AuthContextValue = {
  ready: boolean;
  loading: boolean;
  supabaseConfigured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
