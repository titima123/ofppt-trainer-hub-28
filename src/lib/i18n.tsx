import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "fr" | "ar";

const dict = {
  fr: {
    appName: "OFPPT — Gestion des Formations",
    tagline: "Plateforme de gestion des formations des formateurs",
    login: "Connexion",
    signup: "Créer un compte",
    logout: "Déconnexion",
    email: "Email",
    password: "Mot de passe",
    fullName: "Nom complet",
    matricule: "Matricule",
    centre: "Centre / CDC",
    submit: "Valider",
    dashboard: "Tableau de bord",
    formations: "Formations",
    sessions: "Sessions",
    parcours: "Parcours",
    thematiques: "Thématiques",
    inscriptions: "Mes inscriptions",
    newSession: "Nouvelle session",
    newParcours: "Nouveau parcours",
    newThematique: "Nouvelle thématique",
    title: "Titre",
    description: "Description",
    duration: "Durée (h)",
    category: "Catégorie",
    startDate: "Date de début",
    endDate: "Date de fin",
    location: "Lieu",
    capacity: "Capacité",
    status: "Statut",
    actions: "Actions",
    edit: "Modifier",
    delete: "Supprimer",
    cancel: "Annuler",
    save: "Enregistrer",
    register: "S'inscrire",
    unregister: "Se désinscrire",
    registered: "Inscrit",
    seats: "places",
    planifiee: "Planifiée",
    en_cours: "En cours",
    terminee: "Terminée",
    annulee: "Annulée",
    confirm_delete: "Confirmer la suppression ?",
    no_data: "Aucune donnée",
    welcome: "Bienvenue",
    statSessions: "Sessions actives",
    statParcours: "Parcours",
    statThematiques: "Thématiques",
    statInscriptions: "Inscriptions",
    heroTitle: "Système de Gestion des Formations des Formateurs",
    heroSub: "Planifiez, suivez et évaluez les formations des formateurs de l'OFPPT en un seul endroit.",
    heroCta: "Accéder à la plateforme",
    feat1Title: "Planification centralisée",
    feat1: "Organisez les sessions, parcours et thématiques en quelques clics.",
    feat2Title: "Suivi en temps réel",
    feat2: "Consultez l'avancement et la participation des formateurs.",
    feat3Title: "Données sécurisées",
    feat3: "Accès par rôle et protection des données institutionnelles.",
    profile: "Profil",
    selectParcours: "Sélectionner un parcours",
    none: "— Aucun —",
    backHome: "Retour à l'accueil",
    requiredAuth: "Veuillez vous connecter pour accéder à cette page.",
    saved: "Enregistré",
    deleted: "Supprimé",
    error: "Une erreur est survenue",
  },
  ar: {
    appName: "المكتب — إدارة التكوينات",
    tagline: "منصة إدارة تكوينات المكونين",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    matricule: "رقم التسجيل",
    centre: "المركز",
    submit: "تأكيد",
    dashboard: "لوحة القيادة",
    formations: "التكوينات",
    sessions: "الحصص",
    parcours: "المسارات",
    thematiques: "المحاور",
    inscriptions: "تسجيلاتي",
    newSession: "حصة جديدة",
    newParcours: "مسار جديد",
    newThematique: "محور جديد",
    title: "العنوان",
    description: "الوصف",
    duration: "المدة (س)",
    category: "الفئة",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    location: "المكان",
    capacity: "السعة",
    status: "الحالة",
    actions: "إجراءات",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    save: "حفظ",
    register: "التسجيل",
    unregister: "إلغاء التسجيل",
    registered: "مسجل",
    seats: "مقاعد",
    planifiee: "مبرمجة",
    en_cours: "جارية",
    terminee: "منتهية",
    annulee: "ملغاة",
    confirm_delete: "تأكيد الحذف؟",
    no_data: "لا توجد بيانات",
    welcome: "مرحبا",
    statSessions: "الحصص النشطة",
    statParcours: "المسارات",
    statThematiques: "المحاور",
    statInscriptions: "التسجيلات",
    heroTitle: "نظام إدارة تكوينات المكونين",
    heroSub: "خطط وتابع وقيّم تكوينات مكوني المكتب من مكان واحد.",
    heroCta: "الدخول إلى المنصة",
    feat1Title: "تخطيط مركزي",
    feat1: "نظم الحصص والمسارات والمحاور بكل سهولة.",
    feat2Title: "متابعة آنية",
    feat2: "اطلع على تقدم ومشاركة المكونين.",
    feat3Title: "بيانات آمنة",
    feat3: "وصول حسب الدور وحماية للبيانات المؤسسية.",
    profile: "الملف الشخصي",
    selectParcours: "اختر مسارا",
    none: "— لا شيء —",
    backHome: "العودة للرئيسية",
    requiredAuth: "يرجى تسجيل الدخول للوصول إلى هذه الصفحة.",
    saved: "تم الحفظ",
    deleted: "تم الحذف",
    error: "حدث خطأ",
  },
} as const;

type Key = keyof typeof dict.fr;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "fr");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value: I18nCtx = {
    lang,
    setLang: setLangState,
    t: (k) => dict[lang][k] ?? dict.fr[k] ?? k,
    dir: lang === "ar" ? "rtl" : "ltr",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
