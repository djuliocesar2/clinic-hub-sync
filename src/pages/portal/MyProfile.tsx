import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function MyProfile() {
  const { user } = useAuth();
  const { patientId, profile, refreshProfile } = useRole();
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) setFormData({ full_name: profile.full_name, phone: profile.phone ?? '' });
  }, [profile]);

  useEffect(() => {
    if (patientId) {
      supabase.from('patients').select('*, insurance_plans(name)').eq('id', patientId).single().then(({ data }) => setPatient(data));
    }
  }, [patientId]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: formData.full_name, phone: formData.phone, updated_at: new Date().toISOString(),
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Perfil atualizado!' });
      await refreshProfile();
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('profiles').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    await refreshProfile();
    toast({ title: 'Foto atualizada!' });
    setUploading(false);
  };

  const displayName = formData.full_name || user?.email?.split('@')[0] || '';
  const initials = getInitials(displayName || 'P');

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl bg-muted">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dados da Conta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>E-mail</Label><Input value={user?.email ?? ''} disabled /></div>
          <div><Label>Nome Completo</Label><Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
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
