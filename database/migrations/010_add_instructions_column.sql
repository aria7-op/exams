-- Migration: Add instructions column to exams table
-- Date: 2024-01-XX
-- Description: Adds instructions column to exams table for exam instructions

-- Add instructions column to exams table
ALTER TABLE exams ADD COLUMN instructions TEXT;

-- Add comment to document the column
COMMENT ON COLUMN exams.instructions IS 'Instructions for the exam that students should follow'; 