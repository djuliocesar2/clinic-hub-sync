import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function MyProfile() {
  const { user } = useAuth();
  const { patientId } = useRole();
  const [profile, setProfile] = useState({ full_name: '', phone: '' });
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile({ full_name: data.full_name ?? '', phone: data.phone ?? '' });
    });
    if (patientId) {
      supabase.from('patients').select('*, insurance_plans(name)').eq('id', patientId).single().then(({ data }) => setPatient(data));
    }
  }, [user, patientId]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: profile.full_name, phone: profile.phone, updated_at: new Date().toISOString(),
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Perfil atualizado!' });
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader><CardTitle>Dados da Conta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>E-mail</Label><Input value={user?.email ?? ''} disabled /></div>
          <div><Label>Nome Completo</Label><Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </CardContent>
      </Card>

      {patient && (
        <Card>
          <CardHeader><CardTitle>Dados do Paciente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> {patient.name}</div>
              <div><span className="text-muted-foreground">CPF:</span> {patient.cpf ?? '-'}</div>
              <div><span className="text-muted-foreground">Telefone:</span> {patient.phone ?? '-'}</div>
              <div><span className="text-muted-foreground">E-mail:</span> {patient.email ?? '-'}</div>
              <div><span className="text-muted-foreground">Nascimento:</span> {patient.birth_date ?? '-'}</div>
              <div><span className="text-muted-foreground">Convênio:</span> {patient.insurance_plans?.name ?? '-'}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Para atualizar dados do paciente, entre em contato com a clínica.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
