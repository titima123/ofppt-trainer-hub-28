import { Link } from "react-router-dom";
import { CalendarCheck, ShieldCheck, BarChart3, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-hero text-primary-foreground p-8 md:p-14 shadow-elegant">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t("heroTitle")}</h1>
          <p className="text-lg md:text-xl opacity-95">{t("heroSub")}</p>
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link to={user ? "/dashboard" : "/auth"}>
              {t("heroCta")} <ArrowRight className="ms-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </section>

      <section className="grid md:grid-cols-3 gap-5 mt-10">
        {[
          { i: CalendarCheck, k1: "feat1Title", k2: "feat1" },
          { i: BarChart3, k1: "feat2Title", k2: "feat2" },
          { i: ShieldCheck, k1: "feat3Title", k2: "feat3" },
        ].map((f, idx) => (
          <Card key={idx} className="p-6 transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4">
              <f.i className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{t(f.k1 as any)}</h3>
            <p className="text-muted-foreground text-sm">{t(f.k2 as any)}</p>
          </Card>
        ))}
      </section>
    </Layout>
  );
};

export default Index;
