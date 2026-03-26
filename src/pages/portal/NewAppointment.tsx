import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus } from 'lucide-react';

export default function NewAppointment() {
  const { patientId } = useRole();
  const [dentists, setDentists] = useState<any[]>([]);
  const [form, setForm] = useState({ dentist_id: '', preferred_date: '', preferred_time: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('dentists').select('id, name, specialty').order('name').then(({ data }) => setDentists(data ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);

    const { error } = await supabase.from('appointment_requests').insert({
      patient_id: patientId,
      dentist_id: form.dentist_id || null,
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time || null,
      reason: form.reason || null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSubmitted(true);
      toast({ title: 'Solicitação enviada!', description: 'A clínica entrará em contato para confirmar.' });
    }
    setLoading(false);
  };

  if (!patientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Sua conta ainda não está vinculada a um cadastro de paciente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CalendarPlus className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Solicitação Enviada!</h2>
            <p className="text-muted-foreground">Sua solicitação de agendamento foi recebida. A equipe da clínica entrará em contato para confirmar a data e horário.</p>
            <Button onClick={() => { setSubmitted(false); setForm({ dentist_id: '', preferred_date: '', preferred_time: '', reason: '' }); }}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Solicitar Agendamento</h1>
      <Card>
        <CardHeader><CardTitle>Nova Consulta</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Dentista (opcional)</Label>
              <Select value={form.dentist_id} onValueChange={v => setForm({ ...form, dentist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sem preferência" /></SelectTrigger>
                <SelectContent>
                  {dentists.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}{d.specialty ? ` - ${d.specialty}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data Preferida *</Label><Input type="date" required value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} /></div>
            <div><Label>Horário Preferido</Label><Input type="time" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} /></div>
            <div><Label>Motivo da Consulta</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Descreva o motivo..." /></div>
            <Button type="submit" className="w-full" disabled={loading || !form.preferred_date}>
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
