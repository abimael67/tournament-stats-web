-- Esquema de base de datos para el torneo de baloncesto

-- Tabla de equipos
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL,
  church_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de miembros (jugadores, entrenadores, asistentes)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  jersey_number INTEGER NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'coach', 'assistant')),
  profile_pic_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de partidos
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  team_a_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'postponed')),
  winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  score_team_a INTEGER,
  score_team_b INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_teams CHECK (team_a_id <> team_b_id)
);

-- Tabla de estadísticas
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  technical_fouls INTEGER DEFAULT 0,
  field_goal_attempts INTEGER DEFAULT 0,
  field_goal_made INTEGER DEFAULT 0,
  three_point_attempts INTEGER DEFAULT 0,
  three_point_made INTEGER DEFAULT 0,
  free_throw_attempts INTEGER DEFAULT 0,
  free_throw_made INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_game_member UNIQUE (game_id, member_id)
);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stats_updated_at
BEFORE UPDATE ON stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer','admin','coach','player')),
  team_id UUID REFERENCES teams(id), -- opcional para vincular usuarios a equipos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Función para manejar nuevos usuarios
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'viewer');
  RETURN new;
END;
$$;

-- Trigger para crear perfil cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Política RLS para que solo los administradores puedan modificar datos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla profiles
CREATE POLICY "Los usuarios pueden leer su propio perfil" ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Solo administradores pueden actualizar perfiles" ON profiles FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Políticas para lectura (todos pueden leer)
CREATE POLICY "Todos pueden leer equipos" ON teams FOR SELECT USING (true);
CREATE POLICY "Todos pueden leer miembros" ON members FOR SELECT USING (true);
CREATE POLICY "Todos pueden leer partidos" ON games FOR SELECT USING (true);
CREATE POLICY "Todos pueden leer estadísticas" ON stats FOR SELECT USING (true);

-- Políticas para inserción, actualización y eliminación (solo administradores)
CREATE POLICY "Solo administradores pueden insertar equipos" ON teams FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden actualizar equipos" ON teams FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden eliminar equipos" ON teams FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden insertar miembros" ON members FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden actualizar miembros" ON members FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden eliminar miembros" ON members FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden insertar partidos" ON games FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden actualizar partidos" ON games FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden eliminar partidos" ON games FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden insertar estadísticas" ON stats FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden actualizar estadísticas" ON stats FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Solo administradores pueden eliminar estadísticas" ON stats FOR DELETE 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));