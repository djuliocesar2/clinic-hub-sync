import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'receptionist' | 'dentist' | 'patient';

interface RoleContextType {
  role: AppRole | null;
  loading: boolean;
  isStaff: boolean;
  isPatient: boolean;
  patientId: string | null;
  profile: { full_name: string; phone: string; avatar_url: string | null } | null;
  refreshProfile: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  loading: true,
  isStaff: false,
  isPatient: false,
  patientId: null,
  profile: null,
  refreshProfile: async () => {},
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile({ full_name: data.full_name ?? '', phone: data.phone ?? '', avatar_url: data.avatar_url ?? null });
  };

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPatientId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = (roleData?.role as AppRole) ?? 'patient';
      setRole(userRole);

      // Ensure profile exists
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });

      await fetchProfile();

      // If no role record exists, create patient role
      if (!roleData) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'patient' });
      }

      if (userRole === 'patient') {
        // Check for existing patient_account link
        const { data: pa } = await supabase
          .from('patient_accounts')
          .select('patient_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (pa?.patient_id) {
          setPatientId(pa.patient_id);
        } else {
          // Auto-create patient record and link
          const patientName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Paciente';
          const { data: newPatient } = await supabase
            .from('patients')
            .insert({
              name: patientName,
              email: user.email,
              phone: '',
            })
            .select('id')
            .single();

          if (newPatient) {
            await supabase.from('patient_accounts').insert({
              user_id: user.id,
              patient_id: newPatient.id,
            });
            setPatientId(newPatient.id);
          }
        }
      }

      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isStaff = role === 'admin' || role === 'receptionist' || role === 'dentist';
  const isPatient = role === 'patient';

  return (
    <RoleContext.Provider value={{ role, loading, isStaff, isPatient, patientId, profile, refreshProfile: fetchProfile }}>
      {children}
    </RoleContext.Provider>
  );
}
