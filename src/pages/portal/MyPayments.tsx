import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function MyPayments() {
  const { patientId } = useRole();
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    supabase.from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments(data ?? []));
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
      <h1 className="text-2xl font-bold">Meus Pagamentos</h1>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Data Pgto</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum pagamento encontrado.</TableCell></TableRow>
            ) : payments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">R$ {Number(p.amount).toFixed(2)}</TableCell>
                <TableCell><Badge className={statusColors[p.status] ?? ''}>{p.status}</Badge></TableCell>
                <TableCell>{p.payment_method ?? '-'}</TableCell>
                <TableCell>{p.payment_date ? format(new Date(p.payment_date + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell className="text-sm">{p.notes ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
