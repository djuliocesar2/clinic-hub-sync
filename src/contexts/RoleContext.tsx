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
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  loading: true,
  isStaff: false,
  isPatient: false,
  patientId: null,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPatientId(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const userRole = (data?.role as AppRole) ?? 'patient';
      setRole(userRole);

      if (userRole === 'patient') {
        const { data: pa } = await supabase
          .from('patient_accounts')
          .select('patient_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        setPatientId(pa?.patient_id ?? null);
      }

      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isStaff = role === 'admin' || role === 'receptionist' || role === 'dentist';
  const isPatient = role === 'patient';

  return (
    <RoleContext.Provider value={{ role, loading, isStaff, isPatient, patientId }}>
      {children}
    </RoleContext.Provider>
  );
}
