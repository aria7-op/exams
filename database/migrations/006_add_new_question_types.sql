-- Migration: Add new question types to QuestionType enum
-- Date: 2024-01-XX
-- Description: Adds ACCOUNTING_TABLE and COMPOUND_CHOICE to QuestionType enum

-- Add new question types to the enum
ALTER TYPE "QuestionType" ADD VALUE 'ACCOUNTING_TABLE';
ALTER TYPE "QuestionType" ADD VALUE 'COMPOUND_CHOICE';

-- Verify the enum values
SELECT unnest(enum_range(NULL::"QuestionType")) as question_type; 