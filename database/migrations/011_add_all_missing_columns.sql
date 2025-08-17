-- Migration: Add all missing columns to exams table
-- Date: 2024-01-XX
-- Description: Adds all missing columns that the Prisma schema expects

-- Add instructions column
ALTER TABLE exams ADD COLUMN IF NOT EXISTS instructions TEXT;
COMMENT ON COLUMN exams.instructions IS 'Instructions for the exam that students should follow';

-- Add rules column
ALTER TABLE exams ADD COLUMN IF NOT EXISTS rules TEXT;
COMMENT ON COLUMN exams.rules IS 'Rules and regulations for the exam';

-- Add duration column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS duration INTEGER;
COMMENT ON COLUMN exams.duration IS 'Duration of the exam in minutes';

-- Add passingScore column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS passingScore INTEGER;
COMMENT ON COLUMN exams.passingScore IS 'Minimum score required to pass the exam';

-- Add startDate column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS startDate TIMESTAMP;
COMMENT ON COLUMN exams.startDate IS 'Start date and time of the exam';

-- Add endDate column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS endDate TIMESTAMP;
COMMENT ON COLUMN exams.endDate IS 'End date and time of the exam';

-- Add scheduledStart column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS scheduledStart TIMESTAMP;
COMMENT ON COLUMN exams.scheduledStart IS 'Scheduled start time of the exam';

-- Add scheduledEnd column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS scheduledEnd TIMESTAMP;
COMMENT ON COLUMN exams.scheduledEnd IS 'Scheduled end time of the exam';

-- Add isActive column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
COMMENT ON COLUMN exams.isActive IS 'Whether the exam is currently active';

-- Add createdBy column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS createdBy TEXT;
COMMENT ON COLUMN exams.createdBy IS 'User ID who created the exam';

-- Add updatedAt column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exams.updatedAt IS 'Last update timestamp';

-- Add createdAt column if missing
ALTER TABLE exams ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exams.createdAt IS 'Creation timestamp'; 