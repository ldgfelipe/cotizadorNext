-- Esquema completo para Cotizador ISR (idempotente)
-- Ejecutar en Supabase SQL Editor

-- 1. profiles (perfil de usuario extendido)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. clients (clientes del usuario para cotizaciones)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  rfc TEXT,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. credit_purchases (compras de créditos)
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package TEXT NOT NULL CHECK (package IN ('basico','profesional','enterprise')),
  credits INT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. quote_records (historial de cotizaciones)
CREATE TABLE IF NOT EXISTS public.quote_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. products (productos/paquetes)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. orders (órdenes de compra)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INT DEFAULT 1,
  total NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. settings (configuración global)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. user_settings (preferencias de usuario)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- ============================================================
-- Migraciones para installations donde las tablas ya existen
-- (CREATE TABLE IF NOT EXISTS no agrega columnas a tablas previas)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS rfc TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.quote_records
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS input_data JSONB,
  ADD COLUMN IF NOT EXISTS result_data JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- product_id: algunos despliegues antiguos usaban "product" en singular
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- products.name debe ser único para que el seed sea idempotente
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_unique ON public.products(name);

-- ============================================================
-- Fin de migraciones
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (si existen) y recrear
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quote_records;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quote_records;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view all quotes" ON public.quote_records;

-- Función segura para verificar rol admin sin recursión de RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Políticas RLS para clients
CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para credit_purchases
CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para quote_records
CREATE POLICY "Users can view own quotes" ON public.quote_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON public.quote_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para products (público para leer activos)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

-- Políticas RLS para orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para user_settings
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Limpiar seeds antiguos con acentos para no duplicar productos
DELETE FROM public.products WHERE name IN ('Básico', 'Profesional', 'Enterprise');

-- Insertar productos por defecto (idempotente gracias al índice único en name)
INSERT INTO public.products (name, description, price, category, active) VALUES
  ('basico', '10 cotizaciones', 18.00, 'creditos', true),
  ('profesional', '20 cotizaciones', 35.00, 'creditos', true),
  ('enterprise', '50 cotizaciones', 80.00, 'creditos', true)
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description,
      price = EXCLUDED.price,
      category = EXCLUDED.category,
      active = EXCLUDED.active;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_records_user_id ON public.quote_records(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_records_client_id ON public.quote_records(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id);

-- ============================================================
-- Cupones de créditos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  credits INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- ============================================================
-- Ampliar tipos de paquete en credit_purchases (cupón / recarga admin)
-- ============================================================
DO $$
BEGIN
  ALTER TABLE public.credit_purchases DROP CONSTRAINT IF EXISTS credit_purchases_package_check;
  ALTER TABLE public.credit_purchases ADD CONSTRAINT credit_purchases_package_check
    CHECK (package IN ('basico','profesional','enterprise','cupon','admin_reload'));
END $$;

-- ============================================================
-- Función: canjear cupón (SECURITY DEFINER para operar sobre
-- credit_purchases y coupons sin que RLS bloquee)
-- ============================================================
CREATE OR REPLACE FUNCTION public.canjear_cupon(codigo TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cupon public.coupons%ROWTYPE;
  usuario uuid := auth.uid();
BEGIN
  IF usuario IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  SELECT * INTO cupon FROM public.coupons
  WHERE code = upper(btrim(codigo))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El cupón ingresado no existe';
  END IF;

  IF NOT cupon.active THEN
    RAISE EXCEPTION 'El cupón está inactivo';
  END IF;

  IF cupon.used_count >= cupon.max_uses THEN
    RAISE EXCEPTION 'El cupón ya fue canjeado el máximo de veces';
  END IF;

  INSERT INTO public.credit_purchases (user_id, package, credits, amount, status)
  VALUES (usuario, 'cupon', cupon.credits, 0, 'completed');

  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = cupon.id;

  RETURN cupon.credits;
END;
$$;

REVOKE ALL ON FUNCTION public.canjear_cupon(text) FROM public;
GRANT EXECUTE ON FUNCTION public.canjear_cupon(text) TO authenticated;

-- ============================================================
-- Función: recarga administrativa de créditos
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_recargar_creditos(
  target_user UUID,
  cantidad INTEGER,
  motivo TEXT DEFAULT 'recarga administrativa'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol admin';
  END IF;

  IF cantidad <= 0 OR cantidad > 1000000 THEN
    RAISE EXCEPTION 'Cantidad inválida de créditos';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user) THEN
    RAISE EXCEPTION 'El usuario destino no existe';
  END IF;

  INSERT INTO public.credit_purchases (user_id, package, credits, amount, status)
  VALUES (target_user, 'admin_reload', cantidad, 0, 'completed');

  RETURN cantidad;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_recargar_creditos(uuid, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_recargar_creditos(uuid, integer, text) TO authenticated;