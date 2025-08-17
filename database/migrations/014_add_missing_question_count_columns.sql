-- Migration: Add missing question count columns to exams table
-- Date: 2025-08-17
-- Description: Add the missing question count columns for new question types

-- Add accounting table questions count column
ALTER TABLE exams ADD COLUMN IF NOT EXISTS accounting_table_questions_count INTEGER DEFAULT 0;

-- Add compound choice questions count column  
ALTER TABLE exams ADD COLUMN IF NOT EXISTS compound_choice_questions_count INTEGER DEFAULT 0;

-- Add enhanced compound questions count column
ALTER TABLE exams ADD COLUMN IF NOT EXISTS enhanced_compound_questions_count INTEGER DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN exams.accounting_table_questions_count IS 'Number of accounting table questions in this exam';
COMMENT ON COLUMN exams.compound_choice_questions_count IS 'Number of compound choice questions in this exam';
COMMENT ON COLUMN exams.enhanced_compound_questions_count IS 'Number of enhanced compound questions in this exam';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'exams' 
AND column_name IN ('accounting_table_questions_count', 'compound_choice_questions_count', 'enhanced_compound_questions_count'); 