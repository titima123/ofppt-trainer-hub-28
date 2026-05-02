import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function AuthPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/dashboard");
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const full_name = String(fd.get("full_name"));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("saved"));
      navigate("/dashboard");
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{t("appName")}</h1>
        </div>

        <Card className="p-6 shadow-elegant">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">{t("login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="lemail">{t("email")}</Label>
                  <Input id="lemail" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="lpwd">{t("password")}</Label>
                  <Input id="lpwd" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {t("login")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="sname">{t("fullName")}</Label>
                  <Input id="sname" name="full_name" required />
                </div>
                <div>
                  <Label htmlFor="semail">{t("email")}</Label>
                  <Input id="semail" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="spwd">{t("password")}</Label>
                  <Input id="spwd" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {t("signup")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
