-- Migration: Add remark column to questions table
-- Date: 2024-01-XX
-- Description: Adds remark column to questions table for additional notes

-- Add remark column to questions table
ALTER TABLE questions ADD COLUMN remark TEXT;

-- Add comment to document the field
COMMENT ON COLUMN questions.remark IS 'Additional notes or remarks about the question';

-- Update existing questions to have NULL remark
UPDATE questions SET remark = NULL WHERE remark IS NULL; 