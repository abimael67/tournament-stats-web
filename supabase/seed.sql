-- Datos de ejemplo para el torneo de baloncesto

-- Insertar equipos de ejemplo
INSERT INTO teams (id, team_name, church_name, logo_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Guerreros de Cristo', 'Iglesia Bautista Central', 'https://placehold.co/400x400/blue/white?text=GC'),
('22222222-2222-2222-2222-222222222222', 'Leones de Judá', 'Iglesia Evangélica Pentecostal', 'https://placehold.co/400x400/orange/black?text=LJ'),
('33333333-3333-3333-3333-333333333333', 'Águilas de Sión', 'Iglesia Metodista Unida', 'https://placehold.co/400x400/red/white?text=AS'),
('44444444-4444-4444-4444-444444444444', 'Discípulos', 'Iglesia Cristiana Reformada', 'https://placehold.co/400x400/green/white?text=DC'),
('55555555-5555-5555-5555-555555555555', 'Mensajeros', 'Iglesia Adventista del Séptimo Día', 'https://placehold.co/400x400/purple/white?text=MS'),
('66666666-6666-6666-6666-666666666666', 'Testigos', 'Iglesia Presbiteriana', 'https://placehold.co/400x400/yellow/black?text=TG'),
('77777777-7777-7777-7777-777777777777', 'Profetas', 'Iglesia Luterana', 'https://placehold.co/400x400/brown/white?text=PF'),
('88888888-8888-8888-8888-888888888888', 'Apóstoles', 'Iglesia Católica San Pedro', 'https://placehold.co/400x400/teal/white?text=AP');

-- Insertar miembros de ejemplo (jugadores, entrenadores, asistentes)
-- Equipo 1: Guerreros de Cristo
INSERT INTO members (id, name, age, jersey_number, team_id, role, profile_pic_url) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Juan Pérez', 28, 10, '11111111-1111-1111-1111-111111111111', 'player', 'https://placehold.co/400x400/blue/white?text=JP'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pedro Gómez', 25, 7, '11111111-1111-1111-1111-111111111111', 'player', 'https://placehold.co/400x400/blue/white?text=PG'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Carlos Rodríguez', 45, 0, '11111111-1111-1111-1111-111111111111', 'coach', 'https://placehold.co/400x400/blue/white?text=CR'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Miguel Ángel', 22, 23, '11111111-1111-1111-1111-111111111111', 'player', 'https://placehold.co/400x400/blue/white?text=MA');

-- Equipo 2: Leones de Judá
INSERT INTO members (id, name, age, jersey_number, team_id, role, profile_pic_url) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Roberto Sánchez', 30, 11, '22222222-2222-2222-2222-222222222222', 'player', 'https://placehold.co/400x400/orange/black?text=RS'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'David Martínez', 27, 4, '22222222-2222-2222-2222-222222222222', 'player', 'https://placehold.co/400x400/orange/black?text=DM'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Fernando López', 50, 0, '22222222-2222-2222-2222-222222222222', 'coach', 'https://placehold.co/400x400/orange/black?text=FL'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb1', 'Javier Torres', 24, 15, '22222222-2222-2222-2222-222222222222', 'player', 'https://placehold.co/400x400/orange/black?text=JT');

-- Insertar partidos de ejemplo
INSERT INTO games (id, date, team_a_id, team_b_id, status, winner_team_id, score_team_a, score_team_b) VALUES
('99999999-9999-9999-9999-999999999999', '2023-10-15', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'completed', '11111111-1111-1111-1111-111111111111', 78, 72),
('aaaaaaaa-0000-0000-0000-000000000000', '2023-10-22', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'completed', '44444444-4444-4444-4444-444444444444', 65, 80),
('bbbbbbbb-0000-0000-0000-000000000000', '2023-10-29', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'completed', '55555555-5555-5555-5555-555555555555', 92, 88),
('cccccccc-0000-0000-0000-000000000000', '2023-11-05', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'completed', '88888888-8888-8888-8888-888888888888', 70, 75),
('dddddddd-0000-0000-0000-000000000000', '2023-11-12', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'pending', NULL, NULL, NULL),
('eeeeeeee-0000-0000-0000-000000000000', '2023-11-19', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'pending', NULL, NULL, NULL);

-- Insertar estadísticas de ejemplo para el partido entre Guerreros de Cristo y Leones de Judá
-- Estadísticas de jugadores del equipo Guerreros de Cristo
INSERT INTO stats (game_id, member_id, points, rebounds, assists, technical_fouls, field_goal_attempts, field_goal_made, three_point_attempts, three_point_made, free_throw_attempts, free_throw_made) VALUES
('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 25, 5, 8, 0, 15, 9, 6, 2, 7, 5),
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 18, 10, 3, 1, 12, 7, 4, 1, 5, 3),
('99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 35, 8, 2, 0, 20, 14, 8, 3, 6, 4);

-- Estadísticas de jugadores del equipo Leones de Judá
INSERT INTO stats (game_id, member_id, points, rebounds, assists, technical_fouls, field_goal_attempts, field_goal_made, three_point_attempts, three_point_made, free_throw_attempts, free_throw_made) VALUES
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 22, 6, 5, 0, 18, 8, 7, 2, 6, 4),
('99999999-9999-9999-9999-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 15, 12, 2, 0, 10, 6, 3, 1, 4, 2),
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb1', 35, 4, 7, 1, 22, 15, 5, 2, 5, 3);

-- Insertar un usuario administrador (esto se haría desde la interfaz de Supabase Auth)
-- NOTA: Este es un ejemplo y no funcionará directamente en Supabase, ya que la gestión de usuarios
-- se hace a través de la API de autenticación de Supabase
/*
-- Primero se crearía el usuario en auth.users a través de la API de Supabase Auth
INSERT INTO auth.users (id, email) VALUES
('admin-user-id', 'admin@torneo.com');

-- Luego se insertaría manualmente el perfil con rol de administrador
INSERT INTO profiles (id, full_name, role) VALUES
('admin-user-id', 'Administrador', 'admin');

-- También se pueden crear perfiles para entrenadores y jugadores
INSERT INTO profiles (id, full_name, role, team_id) VALUES
('coach-user-id', 'Carlos Rodríguez', 'coach', '11111111-1111-1111-1111-111111111111'),
('player-user-id', 'Juan Pérez', 'player', '11111111-1111-1111-1111-111111111111');
*/