-- Migración para agregar el estado 'in_progress' al constraint de la tabla games
-- Ejecutar este archivo en Supabase Dashboard > SQL Editor

-- Eliminar el constraint existente
ALTER TABLE games DROP CONSTRAINT games_status_check;

-- Agregar el nuevo constraint con 'in_progress' incluido
ALTER TABLE games ADD CONSTRAINT games_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'postponed'));

-- Verificar que el constraint se aplicó correctamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'games_status_check';