
-- Enum des rôles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'responsable_cdc',
  'responsable_formation',
  'responsable_dr',
  'formateur_animateur',
  'formateur_participant'
);

CREATE TYPE public.session_statut AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee');
CREATE TYPE public.inscription_statut AS ENUM ('en_attente', 'confirmee', 'refusee', 'annulee');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  matricule TEXT,
  centre TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Has role function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','responsable_cdc','responsable_formation')
  )
$$;

-- Thématiques
CREATE TABLE public.thematiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  categorie TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.thematiques ENABLE ROW LEVEL SECURITY;

-- Parcours
CREATE TABLE public.parcours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  duree_heures INT NOT NULL DEFAULT 0,
  thematique_id UUID REFERENCES public.thematiques(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;

-- Sessions de formation
CREATE TABLE public.sessions_formation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  parcours_id UUID REFERENCES public.parcours(id) ON DELETE SET NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lieu TEXT,
  capacite INT NOT NULL DEFAULT 20,
  animateur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  statut session_statut NOT NULL DEFAULT 'planifiee',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions_formation ENABLE ROW LEVEL SECURITY;

-- Inscriptions
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions_formation(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statut inscription_statut NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_thematiques_updated BEFORE UPDATE ON public.thematiques
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_parcours_updated BEFORE UPDATE ON public.parcours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.sessions_formation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'formateur_participant');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========= RLS POLICIES =========

-- Profiles
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Thematiques
CREATE POLICY "Thematiques readable" ON public.thematiques
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert thematiques" ON public.thematiques
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()));
CREATE POLICY "Managers update thematiques" ON public.thematiques
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "Managers delete thematiques" ON public.thematiques
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

-- Parcours
CREATE POLICY "Parcours readable" ON public.parcours
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert parcours" ON public.parcours
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()));
CREATE POLICY "Managers update parcours" ON public.parcours
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "Managers delete parcours" ON public.parcours
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

-- Sessions
CREATE POLICY "Sessions readable" ON public.sessions_formation
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers insert sessions" ON public.sessions_formation
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()));
CREATE POLICY "Managers update sessions" ON public.sessions_formation
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid()) OR auth.uid() = animateur_id);
CREATE POLICY "Managers delete sessions" ON public.sessions_formation
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

-- Inscriptions
CREATE POLICY "View own or manager inscriptions" ON public.inscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_manager(auth.uid()));
CREATE POLICY "Users self-register" ON public.inscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers update inscriptions" ON public.inscriptions
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Managers or owner delete inscriptions" ON public.inscriptions
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()) OR auth.uid() = user_id);
