-- Add 'invalid' status to games table check constraint

-- Drop the existing check constraint
ALTER TABLE games DROP CONSTRAINT games_status_check;

-- Add the new check constraint with 'invalid' included
ALTER TABLE games ADD CONSTRAINT games_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'postponed', 'invalid'));