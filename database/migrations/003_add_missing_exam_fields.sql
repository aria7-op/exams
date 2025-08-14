-- Migration: Add missing fields to exams table
-- Date: 2024-01-XX
-- Description: Add missing fields that are validated and sent from frontend but not stored in database

-- Add missing fields to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS rules TEXT;

-- Note: The following fields are already present in the schema:
-- - allowRetakes (Boolean, default false)
-- - showResults (Boolean, default true) 
-- - showAnswers (Boolean, default false)
-- - randomizeQuestions (Boolean, default true)
-- - randomizeOptions (Boolean, default true)
-- - questionOverlapPercentage (Float, default 10.0)
-- - essayQuestionsCount, multipleChoiceQuestionsCount, etc. (all question type distribution fields)

-- Update existing records to set default values for new fields
UPDATE exams SET 
    instructions = 'Please read all questions carefully before answering.',
    rules = 'No external resources allowed. Complete the exam independently.'
WHERE instructions IS NULL OR rules IS NULL;

-- Add comments to document the fields
COMMENT ON COLUMN exams.instructions IS 'Instructions for students taking this exam';
COMMENT ON COLUMN exams.rules IS 'Rules and guidelines for the exam'; 