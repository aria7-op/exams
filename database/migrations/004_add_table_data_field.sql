-- Migration: Add tableData field to questions table
-- Date: 2024-01-XX
-- Description: Adds tableData field to support accounting table questions

-- Add tableData column to questions table
ALTER TABLE questions ADD COLUMN "tableData" TEXT;

-- Add comment to document the field
COMMENT ON COLUMN questions."tableData" IS 'For accounting table questions, stores the table structure and data';

-- Update existing questions to have NULL tableData
UPDATE questions SET "tableData" = NULL WHERE "tableData" IS NULL; 