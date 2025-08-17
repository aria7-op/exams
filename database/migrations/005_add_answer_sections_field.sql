-- Migration: Add answerSections field to questions table
-- Date: 2024-01-XX
-- Description: Adds answerSections field to support compound choice questions

-- Add answerSections column to questions table
ALTER TABLE questions ADD COLUMN "answerSections" JSONB;

-- Add comment to document the field
COMMENT ON COLUMN questions."answerSections" IS 'For compound choice questions, stores the answer sections structure';

-- Update existing questions to have NULL answerSections
UPDATE questions SET "answerSections" = NULL WHERE "answerSections" IS NULL; 