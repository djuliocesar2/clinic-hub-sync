import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function MyMedicalHistory() {
  const { patientId } = useRole();
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    supabase.from('medical_records')
      .select('*, dentists(name)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .then(({ data }) => setRecords(data ?? []));
  }, [patientId]);

  if (!patientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md"><CardContent className="pt-6 text-center"><p className="text-muted-foreground">Conta não vinculada a um paciente.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Histórico Médico</h1>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Dentista</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : records.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.appointment_date ? format(new Date(r.appointment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell>Dr(a). {r.dentists?.name}</TableCell>
                <TableCell>{r.diagnosis ?? '-'}</TableCell>
                <TableCell className="text-sm max-w-xs truncate">{r.notes ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
