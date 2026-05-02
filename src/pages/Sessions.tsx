import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Calendar, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Session {
  id: string; titre: string; description: string | null;
  parcours_id: string | null; date_debut: string; date_fin: string;
  lieu: string | null; capacite: number; statut: "planifiee"|"en_cours"|"terminee"|"annulee";
  parcours?: { titre: string } | null;
}

const statutVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planifiee: "default", en_cours: "secondary", terminee: "outline", annulee: "destructive",
};

export default function Sessions() {
  const { t } = useI18n();
  const { isManager, user } = useAuth();
  const [items, setItems] = useState<Session[]>([]);
  const [parcours, setParcours] = useState<{ id: string; titre: string }[]>([]);
  const [myInscriptions, setMyInscriptions] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [parcoursId, setParcoursId] = useState<string>("none");
  const [statut, setStatut] = useState<string>("planifiee");

  async function load() {
    const [{ data }, { data: p }, { data: ins }] = await Promise.all([
      supabase.from("sessions_formation").select("*, parcours(titre)").order("date_debut", { ascending: false }),
      supabase.from("parcours").select("id, titre").order("titre"),
      supabase.from("inscriptions").select("session_id").eq("user_id", user!.id),
    ]);
    setItems((data as any) ?? []);
    setParcours(p ?? []);
    setMyInscriptions(new Set((ins ?? []).map((i) => i.session_id)));
  }
  useEffect(() => { load(); }, [user]);

  function openEdit(s: Session | null) {
    setEditing(s);
    setParcoursId(s?.parcours_id ?? "none");
    setStatut(s?.statut ?? "planifiee");
    setOpen(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      titre: String(fd.get("titre")),
      description: String(fd.get("description") || "") || null,
      date_debut: String(fd.get("date_debut")),
      date_fin: String(fd.get("date_fin")),
      lieu: String(fd.get("lieu") || "") || null,
      capacite: Number(fd.get("capacite") || 20),
      parcours_id: parcoursId === "none" ? null : parcoursId,
      statut: statut as any,
    };
    const { error } = editing
      ? await supabase.from("sessions_formation").update(payload).eq("id", editing.id)
      : await supabase.from("sessions_formation").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    setOpen(false); setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    const { error } = await supabase.from("sessions_formation").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("deleted")); load();
  }

  async function toggleInscription(s: Session) {
    if (myInscriptions.has(s.id)) {
      const { error } = await supabase.from("inscriptions").delete().eq("session_id", s.id).eq("user_id", user!.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("inscriptions").insert({ session_id: s.id, user_id: user!.id });
      if (error) return toast.error(error.message);
    }
    load();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("sessions")}</h1>
        {isManager && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => openEdit(null)}><Plus className="h-4 w-4 me-1" />{t("newSession")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? t("edit") : t("newSession")}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div><Label>{t("title")}</Label><Input name="titre" defaultValue={editing?.titre} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("startDate")}</Label><Input name="date_debut" type="date" defaultValue={editing?.date_debut} required /></div>
                  <div><Label>{t("endDate")}</Label><Input name="date_fin" type="date" defaultValue={editing?.date_fin} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("location")}</Label><Input name="lieu" defaultValue={editing?.lieu ?? ""} /></div>
                  <div><Label>{t("capacity")}</Label><Input name="capacite" type="number" min="1" defaultValue={editing?.capacite ?? 20} /></div>
                </div>
                <div>
                  <Label>{t("parcours")}</Label>
                  <Select value={parcoursId} onValueChange={setParcoursId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("none")}</SelectItem>
                      {parcours.map((p) => (<SelectItem key={p.id} value={p.id}>{p.titre}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("status")}</Label>
                  <Select value={statut} onValueChange={setStatut}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["planifiee","en_cours","terminee","annulee"] as const).map((s)=>(
                        <SelectItem key={s} value={s}>{t(s as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("description")}</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} /></div>
                <Button type="submit" className="w-full">{t("save")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t("no_data")}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((s) => {
            const inscrit = myInscriptions.has(s.id);
            return (
              <Card key={s.id} className="p-5 transition-smooth hover:shadow-elegant">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{s.titre}</h3>
                    {s.parcours?.titre && <span className="text-xs text-primary font-medium">{s.parcours.titre}</span>}
                  </div>
                  <Badge variant={statutVariant[s.statut]}>{t(s.statut as any)}</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{s.date_debut} → {s.date_fin}</div>
                  {s.lieu && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{s.lieu}</div>}
                  <div className="flex items-center gap-2"><Users className="h-4 w-4" />{s.capacite} {t("seats")}</div>
                </div>
                {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant={inscrit ? "outline" : "default"}
                    onClick={() => toggleInscription(s)}
                    disabled={s.statut === "annulee" || s.statut === "terminee"}
                  >
                    {inscrit ? t("unregister") : t("register")}
                  </Button>
                  {isManager && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
