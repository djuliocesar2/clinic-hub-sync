import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const emptyForm = { patient_id: '', dentist_id: '', appointment_date: '', appointment_time: '', status: 'agendada', notes: '' };

const statusColors: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const [a, p, d] = await Promise.all([
      supabase.from('appointments').select('*, patients(name), dentists(name)').order('appointment_date', { ascending: false }),
      supabase.from('patients').select('id, name').order('name'),
      supabase.from('dentists').select('id, name').order('name'),
    ]);
    setAppointments(a.data ?? []);
    setPatients(p.data ?? []);
    setDentists(d.data ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (a: any) => {
    setForm({ patient_id: a.patient_id, dentist_id: a.dentist_id, appointment_date: a.appointment_date, appointment_time: a.appointment_time, status: a.status, notes: a.notes ?? '' });
    setEditId(a.id); setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { ...form, notes: form.notes || null, updated_at: new Date().toISOString() };
    const { error } = editId ? await supabase.from('appointments').update(payload).eq('id', editId) : await supabase.from('appointments').insert(payload);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: editId ? 'Agendamento atualizado' : 'Agendamento criado' }); setOpen(false); fetchAll(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este agendamento?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Agendamento excluído' }); fetchAll(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Dentista</TableHead><TableHead>Data</TableHead><TableHead>Hora</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum agendamento.</TableCell></TableRow>
            ) : appointments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.patients?.name}</TableCell>
                <TableCell>{a.dentists?.name}</TableCell>
                <TableCell>{format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{a.appointment_time?.slice(0, 5)}</TableCell>
                <TableCell><Badge className={statusColors[a.status] ?? ''}>{a.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dentista *</Label>
              <Select value={form.dentist_id} onValueChange={v => setForm({ ...form, dentist_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{dentists.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data *</Label><Input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></div>
              <div><Label>Hora *</Label><Input type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.patient_id || !form.dentist_id || !form.appointment_date || !form.appointment_time}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
