import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/utils";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const ensureDailyLog = useCallback(async (userId: string) => {
    try {
      const today = formatDate(new Date());
      console.log("[Auth] Ensuring daily log for:", today);

      const { data: existingLog } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      if (!existingLog) {
        console.log("[Auth] Creating daily log for today");
        
        const { error } = await supabase.from("daily_logs").insert([
          {
            user_id: userId,
            date: today,
          },
        ]);

        if (error) {
          console.error("[Auth] Error creating daily log:", error.message || JSON.stringify(error));
        } else {
          console.log("[Auth] Daily log created");
        }
      } else {
        console.log("[Auth] Daily log already exists");
      }
    } catch (error) {
      console.error("[Auth] Error ensuring daily log:", error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, []);

  const createUserRecord = useCallback(async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const newProfile: Partial<User> = {
        user_id: userId,
        name: authUser.user?.user_metadata?.name || authUser.user?.email?.split("@")[0] || "משתמש",
        email: authUser.user?.email || "",
        role: "user",
        kcal_goal: 1240,
        protein_units: 3,
        carb_units: 3,
        fat_units: 1,
        veg_units: 4,
        fruit_units: 1,
        targets_override: false,
        water_daily_goal: 12,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error("[Auth] Error creating profile:", error.message || JSON.stringify(error));
        throw error;
      }

      console.log("[Auth] Profile created");
      setUser(data);
      
      await ensureDailyLog(userId);
    } catch (error) {
      console.error("[Auth] Failed to create profile:", error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  }, [ensureDailyLog]);

  const loadUser = useCallback(async (userId: string) => {
    try {
      console.log("[Auth] Loading user profile for:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("[Auth] Error loading profile:", error.message);
        console.error("[Auth] Error details:", {
          code: error.code,
          details: error.details,
          hint: error.hint,
          full: JSON.stringify(error)
        });
        
        if (error.code === "PGRST116") {
          console.log("[Auth] Profile not found, creating new profile");
          await createUserRecord(userId);
          return;
        }
        
        throw error;
      }

      console.log("[Auth] Profile loaded:", data.email);
      setUser(data);
      
      await ensureDailyLog(userId);
      
      await registerForPushNotificationsAsync(userId);
    } catch (error) {
      console.error("[Auth] Failed to load profile:", error instanceof Error ? error.message : String(error));
      if (error && typeof error === 'object') {
        console.error("[Auth] Error details:", JSON.stringify(error, null, 2));
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [createUserRecord, ensureDailyLog]);

  useEffect(() => {
    console.log("[Auth] Initializing auth context");
    
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        console.log("[Auth] Initial session:", currentSession?.user?.email || "none");
        setSession(currentSession);
        if (currentSession) {
          loadUser(currentSession.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[Auth] Error getting initial session:", error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("[Auth] Auth state changed:", _event, currentSession?.user?.email || "none");
      setSession(currentSession);
      if (currentSession) {
        loadUser(currentSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log("[Auth] Signing in:", email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Sign in error:", error.message || JSON.stringify(error));
      throw error;
    }
    
    console.log("[Auth] Sign in successful");
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    console.log("[Auth] Signing up:", email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error("[Auth] Sign up error:", error.message || JSON.stringify(error));
      throw error;
    }
    
    console.log("[Auth] Sign up successful");
  }, []);

  const signOut = useCallback(async () => {
    console.log("[Auth] Signing out");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("[Auth] Sign out error:", error.message || JSON.stringify(error));
      throw error;
    }
    
    console.log("[Auth] Sign out successful");
  }, []);

  return useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [session, user, loading, signIn, signUp, signOut]);
});
