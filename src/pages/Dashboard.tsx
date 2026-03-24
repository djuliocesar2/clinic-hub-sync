import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, CalendarDays, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, dentists: 0, todayAppts: 0, completedToday: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('dentists').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).eq('status', 'concluida'),
      supabase.from('appointments').select('*, patients(name), dentists(name)').gte('appointment_date', today).order('appointment_date').order('appointment_time').limit(5),
    ]).then(([p, d, ta, ct, up]) => {
      setStats({
        patients: p.count ?? 0,
        dentists: d.count ?? 0,
        todayAppts: ta.count ?? 0,
        completedToday: ct.count ?? 0,
      });
      setUpcoming(up.data ?? []);
    });
  }, []);

  const cards = [
    { label: 'Pacientes', value: stats.patients, icon: Users, color: 'text-primary' },
    { label: 'Dentistas', value: stats.dentists, icon: UserCog, color: 'text-primary' },
    { label: 'Agendamentos Hoje', value: stats.todayAppts, icon: CalendarDays, color: 'text-primary' },
    { label: 'Concluídos Hoje', value: stats.completedToday, icon: CheckCircle, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum agendamento próximo.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{a.patients?.name}</p>
                    <p className="text-xs text-muted-foreground">Dr(a). {a.dentists?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{format(new Date(a.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{a.appointment_time?.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
