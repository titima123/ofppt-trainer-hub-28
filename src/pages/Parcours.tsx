import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Parcours {
  id: string; titre: string; description: string | null;
  duree_heures: number; thematique_id: string | null;
  thematiques?: { titre: string } | null;
}

export default function ParcoursPage() {
  const { t } = useI18n();
  const { isManager } = useAuth();
  const [items, setItems] = useState<Parcours[]>([]);
  const [thematiques, setThematiques] = useState<{ id: string; titre: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Parcours | null>(null);
  const [thematiqueId, setThematiqueId] = useState<string>("none");

  async function load() {
    const [{ data }, { data: th }] = await Promise.all([
      supabase.from("parcours").select("*, thematiques(titre)").order("created_at", { ascending: false }),
      supabase.from("thematiques").select("id, titre").order("titre"),
    ]);
    setItems((data as any) ?? []);
    setThematiques(th ?? []);
  }
  useEffect(() => { load(); }, []);

  function openEdit(p: Parcours | null) {
    setEditing(p);
    setThematiqueId(p?.thematique_id ?? "none");
    setOpen(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      titre: String(fd.get("titre")),
      description: String(fd.get("description") || "") || null,
      duree_heures: Number(fd.get("duree_heures") || 0),
      thematique_id: thematiqueId === "none" ? null : thematiqueId,
    };
    const { error } = editing
      ? await supabase.from("parcours").update(payload).eq("id", editing.id)
      : await supabase.from("parcours").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    setOpen(false); setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    const { error } = await supabase.from("parcours").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("deleted")); load();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("parcours")}</h1>
        {isManager && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => openEdit(null)}><Plus className="h-4 w-4 me-1" />{t("newParcours")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? t("edit") : t("newParcours")}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div><Label>{t("title")}</Label><Input name="titre" defaultValue={editing?.titre} required /></div>
                <div><Label>{t("duration")}</Label><Input name="duree_heures" type="number" min="0" defaultValue={editing?.duree_heures ?? 0} /></div>
                <div>
                  <Label>{t("thematiques")}</Label>
                  <Select value={thematiqueId} onValueChange={setThematiqueId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("none")}</SelectItem>
                      {thematiques.map((th) => (<SelectItem key={th.id} value={th.id}>{th.titre}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("description")}</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={4} /></div>
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
          {items.map((p) => (
            <Card key={p.id} className="p-5 transition-smooth hover:shadow-elegant">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{p.titre}</h3>
                  {p.thematiques?.titre && (
                    <span className="text-xs text-primary font-medium">{p.thematiques.titre}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {p.duree_heures}h
                </div>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mb-3">{p.description}</p>}
              {isManager && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
