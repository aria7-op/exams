-- Migration: Add enhanced compound question type
-- Date: 2024-01-XX
-- Description: Adds ENHANCED_COMPOUND question type for flexible multi-section questions

-- Add new question type to the enum
ALTER TYPE "QuestionType" ADD VALUE 'ENHANCED_COMPOUND';

-- Verify the enum values
SELECT unnest(enum_range(NULL::"QuestionType")) as question_type; 