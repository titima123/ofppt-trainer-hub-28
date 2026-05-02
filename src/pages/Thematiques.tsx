import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Thematique {
  id: string;
  titre: string;
  description: string | null;
  categorie: string | null;
}

export default function Thematiques() {
  const { t } = useI18n();
  const { isManager } = useAuth();
  const [items, setItems] = useState<Thematique[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Thematique | null>(null);

  async function load() {
    const { data, error } = await supabase.from("thematiques").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      titre: String(fd.get("titre")),
      description: String(fd.get("description") || "") || null,
      categorie: String(fd.get("categorie") || "") || null,
    };
    const { error } = editing
      ? await supabase.from("thematiques").update(payload).eq("id", editing.id)
      : await supabase.from("thematiques").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    setOpen(false); setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm(t("confirm_delete"))) return;
    const { error } = await supabase.from("thematiques").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("deleted")); load();
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("thematiques")}</h1>
        {isManager && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" />{t("newThematique")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? t("edit") : t("newThematique")}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div><Label>{t("title")}</Label><Input name="titre" defaultValue={editing?.titre} required /></div>
                <div><Label>{t("category")}</Label><Input name="categorie" defaultValue={editing?.categorie ?? ""} /></div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <Card key={it.id} className="p-5 transition-smooth hover:shadow-elegant">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg">{it.titre}</h3>
                {it.categorie && <Badge variant="secondary">{it.categorie}</Badge>}
              </div>
              {it.description && <p className="text-sm text-muted-foreground mb-3">{it.description}</p>}
              {isManager && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(it); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
