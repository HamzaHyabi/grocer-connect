import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'supplier' | 'vendor';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  show_phone: boolean;
  show_email: boolean;
  avatar_url: string | null;
}

interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_description: string | null;
  category: string | null;
  rating_average: number;
  rating_count: number;
  is_verified: boolean;
}

interface VendorProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  supplierProfile: SupplierProfile | null;
  vendorProfile: VendorProfile | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, profileData: SignUpProfileData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpProfileData {
  fullName: string;
  city: string;
  phone?: string;
  companyName?: string;
  storeName?: string;
  category?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        const userRole = roleData.role as UserRole;
        setRole(userRole);

        // Fetch role-specific profile
        if (userRole === 'supplier') {
          const { data: supplierData } = await supabase
            .from('supplier_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (supplierData) {
            setSupplierProfile(supplierData as SupplierProfile);
          }
        } else if (userRole === 'vendor') {
          const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (vendorData) {
            setVendorProfile(vendorData as VendorProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer data fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSupplierProfile(null);
          setVendorProfile(null);
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userRole: UserRole,
    profileData: SignUpProfileData
  ): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        email,
        full_name: profileData.fullName,
        city: profileData.city,
        phone: profileData.phone || null,
      });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: userRole,
      });

      if (roleError) throw roleError;

      // Create role-specific profile
      if (userRole === 'supplier' && profileData.companyName) {
        const { error: supplierError } = await supabase.from('supplier_profiles').insert({
          user_id: userId,
          company_name: profileData.companyName,
          category: profileData.category || null,
        });

        if (supplierError) throw supplierError;
      } else if (userRole === 'vendor' && profileData.storeName) {
        const { error: vendorError } = await supabase.from('vendor_profiles').insert({
          user_id: userId,
          store_name: profileData.storeName,
        });

        if (vendorError) throw vendorError;
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSupplierProfile(null);
    setVendorProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        supplierProfile,
        vendorProfile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
