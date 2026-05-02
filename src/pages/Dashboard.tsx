import { useEffect, useState } from "react";
import { CalendarDays, BookOpen, Layers, ClipboardList } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState({ sessions: 0, parcours: 0, thematiques: 0, inscriptions: 0 });

  useEffect(() => {
    (async () => {
      const [s, p, th, ins] = await Promise.all([
        supabase.from("sessions_formation").select("id", { count: "exact", head: true }).in("statut", ["planifiee", "en_cours"]),
        supabase.from("parcours").select("id", { count: "exact", head: true }),
        supabase.from("thematiques").select("id", { count: "exact", head: true }),
        supabase.from("inscriptions").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      setStats({
        sessions: s.count ?? 0,
        parcours: p.count ?? 0,
        thematiques: th.count ?? 0,
        inscriptions: ins.count ?? 0,
      });
    })();
  }, [user]);

  const cards = [
    { k: "statSessions", v: stats.sessions, i: CalendarDays, color: "from-primary to-primary-glow" },
    { k: "statParcours", v: stats.parcours, i: BookOpen, color: "from-secondary to-success" },
    { k: "statThematiques", v: stats.thematiques, i: Layers, color: "from-accent to-warning" },
    { k: "statInscriptions", v: stats.inscriptions, i: ClipboardList, color: "from-info to-primary-glow" },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("welcome")}, {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.k} className="p-5 transition-smooth hover:shadow-elegant">
            <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${c.color} text-primary-foreground flex items-center justify-center mb-3`}>
              <c.i className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold">{c.v}</div>
            <div className="text-sm text-muted-foreground mt-1">{t(c.k as any)}</div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
