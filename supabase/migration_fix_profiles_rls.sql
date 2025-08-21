-- Migración para corregir las políticas RLS de la tabla profiles
-- Esto permite que los usuarios autenticados puedan leer los roles de otros usuarios
-- necesario para verificar permisos de administrador

-- Agregar política para que usuarios autenticados puedan leer roles
CREATE POLICY "Usuarios autenticados pueden leer roles" ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Comentario: Esta política permite que cualquier usuario autenticado pueda
-- consultar la tabla profiles para verificar roles, lo cual es necesario
-- para el funcionamiento correcto del sistema de autenticación después
-- de refrescar el navegador.