-- Migración para agregar columna 'inactive' a la tabla players
-- Ejecutar este archivo en Supabase Dashboard > SQL Editor

-- Agregar la columna 'inactive' de tipo boolean con valor por defecto false
ALTER TABLE players 
ADD COLUMN inactive BOOLEAN NOT NULL DEFAULT false;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'inactive';

-- Comentario sobre el uso de la columna
COMMENT ON COLUMN players.inactive IS 'Indica si el jugador está inactivo (true) o activo (false). Por defecto es false.';