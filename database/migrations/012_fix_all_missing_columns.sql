-- MEGA Migration: Fix ALL missing columns across ALL tables
-- Date: 2024-01-XX
-- Description: Adds all missing columns that the Prisma schema expects

-- ========================================
-- EXAMS TABLE
-- ========================================
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

-- ========================================
-- EXAM_ATTEMPTS TABLE
-- ========================================
-- Add wantsCertificate column
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS wantsCertificate BOOLEAN DEFAULT false;
COMMENT ON COLUMN exam_attempts.wantsCertificate IS 'Whether the student wants a certificate after passing';

-- Add certificateIssued column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS certificateIssued BOOLEAN DEFAULT false;
COMMENT ON COLUMN exam_attempts.certificateIssued IS 'Whether a certificate has been issued';

-- Add certificateIssuedAt column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS certificateIssuedAt TIMESTAMP;
COMMENT ON COLUMN exam_attempts.certificateIssuedAt IS 'When the certificate was issued';

-- Add certificateNumber column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS certificateNumber TEXT;
COMMENT ON COLUMN exam_attempts.certificateNumber IS 'Unique certificate number';

-- Add feedback column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS feedback TEXT;
COMMENT ON COLUMN exam_attempts.feedback IS 'Feedback on the exam attempt';

-- Add notes column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN exam_attempts.notes IS 'Additional notes about the attempt';

-- Add ipAddress column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS ipAddress TEXT;
COMMENT ON COLUMN exam_attempts.ipAddress IS 'IP address of the student during attempt';

-- Add userAgent column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS userAgent TEXT;
COMMENT ON COLUMN exam_attempts.userAgent IS 'User agent string from browser';

-- Add startedAt column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS startedAt TIMESTAMP;
COMMENT ON COLUMN exam_attempts.startedAt IS 'When the attempt was started';

-- Add completedAt column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS completedAt TIMESTAMP;
COMMENT ON COLUMN exam_attempts.completedAt IS 'When the attempt was completed';

-- Add timeSpent column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS timeSpent INTEGER;
COMMENT ON COLUMN exam_attempts.timeSpent IS 'Time spent on exam in seconds';

-- Add isActive column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
COMMENT ON COLUMN exam_attempts.isActive IS 'Whether the attempt is active';

-- Add createdBy column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS createdBy TEXT;
COMMENT ON COLUMN exam_attempts.createdBy IS 'User ID who created the attempt';

-- Add updatedAt column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exam_attempts.updatedAt IS 'Last update timestamp';

-- Add createdAt column if missing
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exam_attempts.createdAt IS 'Creation timestamp';

-- ========================================
-- QUESTIONS TABLE (if not already added)
-- ========================================
-- Add remark column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS remark TEXT;
COMMENT ON COLUMN questions.remark IS 'Additional notes or remarks about the question';

-- Add tableData column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS "tableData" TEXT;
COMMENT ON COLUMN questions."tableData" IS 'Table data for accounting table questions';

-- Add answerSections column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS "answerSections" JSONB;
COMMENT ON COLUMN questions."answerSections" IS 'Answer sections for compound questions';

-- Add isActive column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
COMMENT ON COLUMN questions.isActive IS 'Whether the question is active';

-- Add createdBy column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS createdBy TEXT;
COMMENT ON COLUMN questions.createdBy IS 'User ID who created the question';

-- Add updatedAt column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN questions.updatedAt IS 'Last update timestamp';

-- Add createdAt column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN questions.createdAt IS 'Creation timestamp';

-- ========================================
-- EXAM_BOOKINGS TABLE
-- ========================================
-- Add status column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
COMMENT ON COLUMN exam_bookings.status IS 'Status of the booking (PENDING, CONFIRMED, CANCELLED)';

-- Add notes column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN exam_bookings.notes IS 'Additional notes about the booking';

-- Add isActive column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
COMMENT ON COLUMN exam_bookings.isActive IS 'Whether the booking is active';

-- Add createdBy column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS createdBy TEXT;
COMMENT ON COLUMN exam_bookings.createdBy IS 'User ID who created the booking';

-- Add updatedAt column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exam_bookings.updatedAt IS 'Last update timestamp';

-- Add createdAt column if missing
ALTER TABLE exam_bookings ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
COMMENT ON COLUMN exam_bookings.createdAt IS 'Creation timestamp';

-- ========================================
-- VERIFY ALL COLUMNS EXIST
-- ========================================
-- Check exams table
SELECT 'exams' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'exams' AND table_schema = 'public'
ORDER BY column_name;

-- Check exam_attempts table
SELECT 'exam_attempts' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'exam_attempts' AND table_schema = 'public'
ORDER BY column_name;

-- Check questions table
SELECT 'questions' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'questions' AND table_schema = 'public'
ORDER BY column_name;

-- Check exam_bookings table
SELECT 'exam_bookings' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'exam_bookings' AND table_schema = 'public'
ORDER BY column_name; 