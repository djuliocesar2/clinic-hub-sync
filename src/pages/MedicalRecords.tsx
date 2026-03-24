import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const emptyForm = { patient_id: '', dentist_id: '', diagnosis: '', notes: '', appointment_date: '' };

export default function MedicalRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const [r, p, d] = await Promise.all([
      supabase.from('medical_records').select('*, patients(name), dentists(name)').order('created_at', { ascending: false }),
      supabase.from('patients').select('id, name').order('name'),
      supabase.from('dentists').select('id, name').order('name'),
    ]);
    setRecords(r.data ?? []);
    setPatients(p.data ?? []);
    setDentists(d.data ?? []);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (r: any) => {
    setForm({ patient_id: r.patient_id, dentist_id: r.dentist_id, diagnosis: r.diagnosis ?? '', notes: r.notes ?? '', appointment_date: r.appointment_date ?? '' });
    setEditId(r.id); setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { patient_id: form.patient_id, dentist_id: form.dentist_id, diagnosis: form.diagnosis || null, notes: form.notes || null, appointment_date: form.appointment_date || null, updated_at: new Date().toISOString() };
    const { error } = editId ? await supabase.from('medical_records').update(payload).eq('id', editId) : await supabase.from('medical_records').insert(payload);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: editId ? 'Prontuário atualizado' : 'Prontuário criado' }); setOpen(false); fetchAll(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este prontuário?')) return;
    const { error } = await supabase.from('medical_records').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Prontuário excluído' }); fetchAll(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prontuários</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Prontuário</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Dentista</TableHead><TableHead>Diagnóstico</TableHead><TableHead>Data</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum prontuário.</TableCell></TableRow>
            ) : records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.patients?.name}</TableCell>
                <TableCell>{r.dentists?.name}</TableCell>
                <TableCell>{r.diagnosis ?? '-'}</TableCell>
                <TableCell>{r.appointment_date ? format(new Date(r.appointment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Prontuário' : 'Novo Prontuário'}</DialogTitle></DialogHeader>
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
            <div><Label>Diagnóstico</Label><Input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div><Label>Data da Consulta</Label><Input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.patient_id || !form.dentist_id}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
