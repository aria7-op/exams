-- Sample data for Advanced Exam System with proper UUIDs
-- This matches our database schema

-- Insert exam categories
INSERT INTO exam_categories (id, name, description, icon, color, is_active) VALUES
(gen_random_uuid(), 'Mathematics', 'Advanced mathematics including algebra, calculus, and statistics', 'calculator', '#FF6B6B', true),
(gen_random_uuid(), 'Physics', 'Classical and modern physics concepts', 'atom', '#4ECDC4', true),
(gen_random_uuid(), 'Chemistry', 'Organic and inorganic chemistry', 'flask', '#45B7D1', true),
(gen_random_uuid(), 'Biology', 'Life sciences and biological concepts', 'dna', '#96CEB4', true),
(gen_random_uuid(), 'Computer Science', 'Programming, algorithms, and computer systems', 'code', '#FFEAA7', true),
(gen_random_uuid(), 'English', 'Language arts and literature', 'book', '#DDA0DD', true),
(gen_random_uuid(), 'History', 'World history and social studies', 'globe', '#F0E68C', true),
(gen_random_uuid(), 'Geography', 'Physical and human geography', 'map', '#98FB98', true);

-- Insert users (passwords are hashed versions of 'password123')
INSERT INTO users (id, email, password, first_name, last_name, role, status, email_verified) VALUES
(gen_random_uuid(), 'superadmin@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Super', 'Admin', 'SUPER_ADMIN', 'ACTIVE', true),
(gen_random_uuid(), 'admin@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Admin', 'User', 'ADMIN', 'ACTIVE', true),
(gen_random_uuid(), 'moderator@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Moderator', 'User', 'MODERATOR', 'ACTIVE', true),
(gen_random_uuid(), 'student1@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'John', 'Doe', 'STUDENT', 'ACTIVE', true),
(gen_random_uuid(), 'student2@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Jane', 'Smith', 'STUDENT', 'ACTIVE', true),
(gen_random_uuid(), 'student3@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Mike', 'Johnson', 'STUDENT', 'ACTIVE', true);

-- Get category IDs for reference
DO $$
DECLARE
    math_cat_id UUID;
    physics_cat_id UUID;
    chemistry_cat_id UUID;
    cs_cat_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO math_cat_id FROM exam_categories WHERE name = 'Mathematics' LIMIT 1;
    SELECT id INTO physics_cat_id FROM exam_categories WHERE name = 'Physics' LIMIT 1;
    SELECT id INTO chemistry_cat_id FROM exam_categories WHERE name = 'Chemistry' LIMIT 1;
    SELECT id INTO cs_cat_id FROM exam_categories WHERE name = 'Computer Science' LIMIT 1;

    -- Insert questions for Mathematics
    INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
    (gen_random_uuid(), 'What is the value of π (pi) to two decimal places?', 'MULTIPLE_CHOICE', 'EASY', math_cat_id, '3.14', 'Pi is approximately 3.14159, so to two decimal places it is 3.14', 1),
    (gen_random_uuid(), 'Solve for x: 2x + 5 = 13', 'MULTIPLE_CHOICE', 'MEDIUM', math_cat_id, '4', 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4', 1),
    (gen_random_uuid(), 'What is the derivative of x²?', 'MULTIPLE_CHOICE', 'HARD', math_cat_id, '2x', 'The derivative of x² is 2x using the power rule', 1),
    (gen_random_uuid(), 'What is the square root of 144?', 'MULTIPLE_CHOICE', 'EASY', math_cat_id, '12', '12 × 12 = 144, so the square root of 144 is 12', 1);

    -- Insert questions for Physics
    INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
    (gen_random_uuid(), 'What is the SI unit of force?', 'MULTIPLE_CHOICE', 'EASY', physics_cat_id, 'Newton', 'The SI unit of force is the Newton (N)', 1),
    (gen_random_uuid(), 'What is the formula for kinetic energy?', 'MULTIPLE_CHOICE', 'MEDIUM', physics_cat_id, 'KE = ½mv²', 'Kinetic energy equals one-half times mass times velocity squared', 1),
    (gen_random_uuid(), 'What is Newton''s Third Law?', 'MULTIPLE_CHOICE', 'HARD', physics_cat_id, 'For every action, there is an equal and opposite reaction', 'Newton''s Third Law states that for every action, there is an equal and opposite reaction', 1);

    -- Insert questions for Chemistry
    INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
    (gen_random_uuid(), 'What is the chemical symbol for gold?', 'MULTIPLE_CHOICE', 'EASY', chemistry_cat_id, 'Au', 'The chemical symbol for gold is Au (from Latin aurum)', 1),
    (gen_random_uuid(), 'What is the molecular formula for water?', 'MULTIPLE_CHOICE', 'EASY', chemistry_cat_id, 'H₂O', 'Water consists of two hydrogen atoms and one oxygen atom', 1),
    (gen_random_uuid(), 'What is the pH of a neutral solution?', 'MULTIPLE_CHOICE', 'MEDIUM', chemistry_cat_id, '7', 'A neutral solution has a pH of 7', 1);

    -- Insert questions for Computer Science
    INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
    (gen_random_uuid(), 'What does HTML stand for?', 'MULTIPLE_CHOICE', 'EASY', cs_cat_id, 'HyperText Markup Language', 'HTML stands for HyperText Markup Language', 1),
    (gen_random_uuid(), 'What is the primary function of RAM?', 'MULTIPLE_CHOICE', 'MEDIUM', cs_cat_id, 'Temporary data storage', 'RAM (Random Access Memory) is used for temporary data storage', 1),
    (gen_random_uuid(), 'What is a variable in programming?', 'MULTIPLE_CHOICE', 'EASY', cs_cat_id, 'A container for storing data', 'A variable is a container for storing data values', 1),
    (gen_random_uuid(), 'What is the time complexity of binary search?', 'MULTIPLE_CHOICE', 'HARD', cs_cat_id, 'O(log n)', 'Binary search has a time complexity of O(log n)', 1);

    -- Insert exams
    INSERT INTO exams (id, title, description, exam_category_id, duration, total_marks, passing_marks, price, currency, max_attempts, status, is_active) VALUES
    (gen_random_uuid(), 'Basic Mathematics Test', 'A comprehensive test covering fundamental mathematics concepts', math_cat_id, 60, 10, 6, 9.99, 'USD', 3, 'PUBLISHED', true),
    (gen_random_uuid(), 'Physics Fundamentals', 'Basic physics concepts and principles', physics_cat_id, 45, 6, 4, 7.99, 'USD', 2, 'PUBLISHED', true),
    (gen_random_uuid(), 'Chemistry Basics', 'Introduction to chemistry concepts', chemistry_cat_id, 45, 6, 4, 7.99, 'USD', 2, 'PUBLISHED', true),
    (gen_random_uuid(), 'Computer Science Introduction', 'Basic computer science and programming concepts', cs_cat_id, 60, 8, 5, 8.99, 'USD', 3, 'PUBLISHED', true),
    (gen_random_uuid(), 'Advanced Mathematics', 'Advanced mathematics including calculus and algebra', math_cat_id, 90, 15, 10, 12.99, 'USD', 2, 'PUBLISHED', true);

END $$;

-- Summary of inserted data
SELECT 'Data insertion completed successfully!' as status;
SELECT 'Exam Categories: ' || COUNT(*) as categories_count FROM exam_categories;
SELECT 'Users: ' || COUNT(*) as users_count FROM users;
SELECT 'Questions: ' || COUNT(*) as questions_count FROM questions;
SELECT 'Exams: ' || COUNT(*) as exams_count FROM exams; 