import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, BookOpen, CalendarDays, Layers, LogOut, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/sessions", icon: CalendarDays, label: t("sessions") },
    { to: "/parcours", icon: BookOpen, label: t("parcours") },
    { to: "/thematiques", icon: Layers, label: t("thematiques") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-elegant">
        <div className="container flex items-center justify-between py-3 gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <GraduationCap className="h-7 w-7" />
            <span className="text-lg hidden sm:inline">{t("appName")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            >
              <Globe className="h-4 w-4 me-1" />
              {lang === "fr" ? "العربية" : "Français"}
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/10"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4 me-1" />
                {t("logout")}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => navigate("/auth")}>
                {t("login")}
              </Button>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="bg-card border-b">
          <div className="container flex gap-1 overflow-x-auto py-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-smooth whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-1 container py-6">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="container py-4 text-center text-sm text-muted-foreground">
          © 2025-2026 OFPPT — {t("appName")}
        </div>
      </footer>
    </div>
  );
}
