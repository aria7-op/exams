-- Mock Exam System Database Initialization
-- This script creates the database schema and populates it with sample data

-- Create database if not exists
-- CREATE DATABASE IF NOT EXISTS mock_exam_db;

-- Connect to the database
-- \c mock_exam_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sample exam categories
INSERT INTO exam_categories (id, name, description, color, is_active, sort_order, created_at, updated_at) VALUES
('cat_001', 'Mathematics', 'Basic mathematics and algebra', '#3B82F6', true, 1, NOW(), NOW()),
('cat_002', 'Physics', 'Physics fundamentals', '#10B981', true, 2, NOW(), NOW()),
('cat_003', 'Chemistry', 'Chemistry basics', '#F59E0B', true, 3, NOW(), NOW()),
('cat_004', 'Biology', 'Biology fundamentals', '#EF4444', true, 4, NOW(), NOW()),
('cat_005', 'Computer Science', 'Programming and computer science', '#8B5CF6', true, 5, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample questions for Mathematics
INSERT INTO questions (id, text, type, difficulty, exam_category_id, marks, is_active, is_public, created_by, created_at, updated_at) VALUES
('q_math_001', 'What is the value of 2x + 3 when x = 4?', 'MCQ', 'EASY', 'cat_001', 1, true, true, 'admin_001', NOW(), NOW()),
('q_math_002', 'What is the area of a circle with radius 5 units?', 'MCQ', 'MEDIUM', 'cat_001', 1, true, true, 'admin_001', NOW(), NOW()),
('q_math_003', 'Solve for x: 3x - 7 = 8', 'MCQ', 'MEDIUM', 'cat_001', 1, true, true, 'admin_001', NOW(), NOW()),
('q_math_004', 'What is the derivative of x²?', 'MCQ', 'HARD', 'cat_001', 1, true, true, 'admin_001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create question options
INSERT INTO question_options (id, question_id, text, is_correct, sort_order, created_at) VALUES
-- Question 1: What is the value of 2x + 3 when x = 4?
('opt_001', 'q_math_001', '11', true, 1, NOW()),
('opt_002', 'q_math_001', '10', false, 2, NOW()),
('opt_003', 'q_math_001', '12', false, 3, NOW()),
('opt_004', 'q_math_001', '9', false, 4, NOW()),

-- Question 2: What is the area of a circle with radius 5 units?
('opt_005', 'q_math_002', '25π', false, 1, NOW()),
('opt_006', 'q_math_002', '25π square units', true, 2, NOW()),
('opt_007', 'q_math_002', '10π', false, 3, NOW()),
('opt_008', 'q_math_002', '50π', false, 4, NOW()),

-- Question 3: Solve for x: 3x - 7 = 8
('opt_009', 'q_math_003', '5', true, 1, NOW()),
('opt_010', 'q_math_003', '4', false, 2, NOW()),
('opt_011', 'q_math_003', '6', false, 3, NOW()),
('opt_012', 'q_math_003', '3', false, 4, NOW()),

-- Question 4: What is the derivative of x²?
('opt_013', 'q_math_004', 'x', false, 1, NOW()),
('opt_014', 'q_math_004', '2x', true, 2, NOW()),
('opt_015', 'q_math_004', 'x²', false, 3, NOW()),
('opt_016', 'q_math_004', '2x²', false, 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample exam
INSERT INTO exams (id, title, description, exam_category_id, duration, total_marks, passing_marks, price, currency, is_active, is_public, allow_retakes, max_retakes, show_results, show_answers, randomize_questions, randomize_options, question_overlap_percentage, created_by, created_at, updated_at) VALUES
('exam_001', 'Basic Mathematics Test', 'A comprehensive test covering basic mathematics concepts', 'cat_001', 60, 4, 2, 0.00, 'USD', true, true, true, 3, true, false, true, true, 10.0, 'admin_001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, is_email_verified, created_at, updated_at) VALUES
('admin_001', 'admin@mockexam.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Admin', 'User', 'SUPER_ADMIN', true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update question usage counts
UPDATE questions SET usage_count = 0 WHERE usage_count IS NULL;

-- Set approved questions
UPDATE questions SET approved_by = 'admin_001', approved_at = NOW() WHERE approved_by IS NULL; 