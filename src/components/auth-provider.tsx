"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type Profile = {
    id: string;
    full_name: string | null;
    role: string; // Changed to string to be more flexible with simulation
    student_id?: string;
    cpf?: string;
    is_active?: boolean;
  };

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  simulatedRole: string | null;
  setSimulatedRole: (role: string | null) => void;
  originalRole: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  simulatedRole: null,
  setSimulatedRole: () => {},
  originalRole: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRoleState] = useState<string | null>(null);

  useEffect(() => {
    // Load simulated role from localStorage on mount
    const savedRole = localStorage.getItem("pfm_simulated_role");
    if (savedRole) {
      setSimulatedRoleState(savedRole);
    }

      const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
  
        if (data) {
          if (data.is_active === false) {
            await supabase.auth.signOut();
            setProfile(null);
            setUser(null);
            return;
          }
          setProfile(data);
        }
      };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          // Clear simulation on logout
          localStorage.removeItem("pfm_simulated_role");
          setSimulatedRoleState(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const setSimulatedRole = (role: string | null) => {
    if (role) {
      localStorage.setItem("pfm_simulated_role", role);
    } else {
      localStorage.removeItem("pfm_simulated_role");
    }
    setSimulatedRoleState(role);
  };

  const signOut = async () => {
    localStorage.removeItem("pfm_simulated_role");
    setSimulatedRoleState(null);
    await supabase.auth.signOut();
  };

  // The actual profile used in the app, with simulated role if active
  const effectiveProfile = profile ? (() => {
    if (profile.role !== 'admin' || !simulatedRole) return profile;

    const baseSimulated = { ...profile, role: simulatedRole };

    // Inject test data based on role to avoid errors in simulated views
    if (simulatedRole === 'student' || simulatedRole === 'aluno') {
      return { 
        ...baseSimulated, 
        role: 'aluno',
        student_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'ALUNO TESTE DEMONSTRATIVO'
      };
    }
    if (simulatedRole === 'instructor' || simulatedRole === 'instrutor') {
      return { 
        ...baseSimulated, 
        role: 'instrutor',
        full_name: 'INSTRUTOR TESTE DEMONSTRATIVO'
      };
    }
    if (simulatedRole === 'guardian' || simulatedRole === 'responsavel') {
      return { 
        ...baseSimulated, 
        role: 'responsavel',
        cpf: '111.111.111-11',
        full_name: 'RESPONSÁVEL TESTE DEMONSTRATIVO'
      };
    }
    if (simulatedRole === 'coord_geral') {
      return { 
        ...baseSimulated, 
        role: 'coord_geral',
        full_name: 'COORDENADOR GERAL TESTE'
      };
    }
    if (simulatedRole === 'coord_nucleo') {
      return { 
        ...baseSimulated, 
        role: 'coord_nucleo',
        full_name: 'COORDENADOR NÚCLEO TESTE'
      };
    }
    return baseSimulated;
  })() : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: effectiveProfile, 
      loading, 
      signOut, 
      simulatedRole, 
      setSimulatedRole,
      originalRole: profile?.role ?? null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
