-- Sample data for Advanced Exam System
-- This matches our database schema

-- Insert exam categories
INSERT INTO exam_categories (id, name, description, icon, color, is_active) VALUES
('cat_001', 'Mathematics', 'Advanced mathematics including algebra, calculus, and statistics', 'calculator', '#FF6B6B', true),
('cat_002', 'Physics', 'Classical and modern physics concepts', 'atom', '#4ECDC4', true),
('cat_003', 'Chemistry', 'Organic and inorganic chemistry', 'flask', '#45B7D1', true),
('cat_004', 'Biology', 'Life sciences and biological concepts', 'dna', '#96CEB4', true),
('cat_005', 'Computer Science', 'Programming, algorithms, and computer systems', 'code', '#FFEAA7', true),
('cat_006', 'English', 'Language arts and literature', 'book', '#DDA0DD', true),
('cat_007', 'History', 'World history and social studies', 'globe', '#F0E68C', true),
('cat_008', 'Geography', 'Physical and human geography', 'map', '#98FB98', true);

-- Insert users (passwords are hashed versions of 'password123')
INSERT INTO users (id, email, password, first_name, last_name, role, status, email_verified) VALUES
('user_001', 'superadmin@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Super', 'Admin', 'SUPER_ADMIN', 'ACTIVE', true),
('user_002', 'admin@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Admin', 'User', 'ADMIN', 'ACTIVE', true),
('user_003', 'moderator@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Moderator', 'User', 'MODERATOR', 'ACTIVE', true),
('user_004', 'student1@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'John', 'Doe', 'STUDENT', 'ACTIVE', true),
('user_005', 'student2@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Jane', 'Smith', 'STUDENT', 'ACTIVE', true),
('user_006', 'student3@mocktest.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Mike', 'Johnson', 'STUDENT', 'ACTIVE', true);

-- Insert questions for Mathematics
INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
('q_001', 'What is the value of π (pi) to two decimal places?', 'MULTIPLE_CHOICE', 'EASY', 'cat_001', '3.14', 'Pi is approximately 3.14159, so to two decimal places it is 3.14', 1),
('q_002', 'Solve for x: 2x + 5 = 13', 'MULTIPLE_CHOICE', 'MEDIUM', 'cat_001', '4', 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4', 1),
('q_003', 'What is the derivative of x²?', 'MULTIPLE_CHOICE', 'HARD', 'cat_001', '2x', 'The derivative of x² is 2x using the power rule', 1),
('q_004', 'What is the square root of 144?', 'MULTIPLE_CHOICE', 'EASY', 'cat_001', '12', '12 × 12 = 144, so the square root of 144 is 12', 1);

-- Insert questions for Physics
INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
('q_005', 'What is the SI unit of force?', 'MULTIPLE_CHOICE', 'EASY', 'cat_002', 'Newton', 'The SI unit of force is the Newton (N)', 1),
('q_006', 'What is the formula for kinetic energy?', 'MULTIPLE_CHOICE', 'MEDIUM', 'cat_002', 'KE = ½mv²', 'Kinetic energy equals one-half times mass times velocity squared', 1),
('q_007', 'What is Newton''s Third Law?', 'MULTIPLE_CHOICE', 'HARD', 'cat_002', 'For every action, there is an equal and opposite reaction', 'Newton''s Third Law states that for every action, there is an equal and opposite reaction', 1);

-- Insert questions for Chemistry
INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
('q_008', 'What is the chemical symbol for gold?', 'MULTIPLE_CHOICE', 'EASY', 'cat_003', 'Au', 'The chemical symbol for gold is Au (from Latin aurum)', 1),
('q_009', 'What is the molecular formula for water?', 'MULTIPLE_CHOICE', 'EASY', 'cat_003', 'H₂O', 'Water consists of two hydrogen atoms and one oxygen atom', 1),
('q_010', 'What is the pH of a neutral solution?', 'MULTIPLE_CHOICE', 'MEDIUM', 'cat_003', '7', 'A neutral solution has a pH of 7', 1);

-- Insert questions for Computer Science
INSERT INTO questions (id, text, type, difficulty, exam_category_id, correct_answer, explanation, points) VALUES
('q_011', 'What does HTML stand for?', 'MULTIPLE_CHOICE', 'EASY', 'cat_005', 'HyperText Markup Language', 'HTML stands for HyperText Markup Language', 1),
('q_012', 'What is the primary function of RAM?', 'MULTIPLE_CHOICE', 'MEDIUM', 'cat_005', 'Temporary data storage', 'RAM (Random Access Memory) is used for temporary data storage', 1),
('q_013', 'What is a variable in programming?', 'MULTIPLE_CHOICE', 'EASY', 'cat_005', 'A container for storing data', 'A variable is a container for storing data values', 1),
('q_014', 'What is the time complexity of binary search?', 'MULTIPLE_CHOICE', 'HARD', 'cat_005', 'O(log n)', 'Binary search has a time complexity of O(log n)', 1);

-- Insert question options for Mathematics
INSERT INTO question_options (id, question_id, text, is_correct, order_index) VALUES
('opt_001', 'q_001', '3.14', true, 1),
('opt_002', 'q_001', '3.15', false, 2),
('opt_003', 'q_001', '3.13', false, 3),
('opt_004', 'q_001', '3.16', false, 4),
('opt_005', 'q_002', '3', false, 1),
('opt_006', 'q_002', '4', true, 2),
('opt_007', 'q_002', '5', false, 3),
('opt_008', 'q_002', '6', false, 4),
('opt_009', 'q_003', 'x', false, 1),
('opt_010', 'q_003', '2x', true, 2),
('opt_011', 'q_003', 'x²', false, 3),
('opt_012', 'q_003', '2x²', false, 4),
('opt_013', 'q_004', '10', false, 1),
('opt_014', 'q_004', '11', false, 2),
('opt_015', 'q_004', '12', true, 3),
('opt_016', 'q_004', '13', false, 4);

-- Insert question options for Physics
INSERT INTO question_options (id, question_id, text, is_correct, order_index) VALUES
('opt_017', 'q_005', 'Joule', false, 1),
('opt_018', 'q_005', 'Newton', true, 2),
('opt_019', 'q_005', 'Watt', false, 3),
('opt_020', 'q_005', 'Pascal', false, 4),
('opt_021', 'q_006', 'KE = mv', false, 1),
('opt_022', 'q_006', 'KE = ½mv²', true, 2),
('opt_023', 'q_006', 'KE = mv²', false, 3),
('opt_024', 'q_006', 'KE = 2mv', false, 4),
('opt_025', 'q_007', 'An object in motion stays in motion', false, 1),
('opt_026', 'q_007', 'Force equals mass times acceleration', false, 2),
('opt_027', 'q_007', 'For every action, there is an equal and opposite reaction', true, 3),
('opt_028', 'q_007', 'Energy cannot be created or destroyed', false, 4);

-- Insert question options for Chemistry
INSERT INTO question_options (id, question_id, text, is_correct, order_index) VALUES
('opt_029', 'q_008', 'Ag', false, 1),
('opt_030', 'q_008', 'Au', true, 2),
('opt_031', 'q_008', 'Fe', false, 3),
('opt_032', 'q_008', 'Cu', false, 4),
('opt_033', 'q_009', 'CO₂', false, 1),
('opt_034', 'q_009', 'H₂O', true, 2),
('opt_035', 'q_009', 'O₂', false, 3),
('opt_036', 'q_009', 'H₂', false, 4),
('opt_037', 'q_010', '0', false, 1),
('opt_038', 'q_010', '7', true, 2),
('opt_039', 'q_010', '14', false, 3),
('opt_040', 'q_010', '10', false, 4);

-- Insert question options for Computer Science
INSERT INTO question_options (id, question_id, text, is_correct, order_index) VALUES
('opt_041', 'q_011', 'High Tech Modern Language', false, 1),
('opt_042', 'q_011', 'HyperText Markup Language', true, 2),
('opt_043', 'q_011', 'Home Tool Markup Language', false, 3),
('opt_044', 'q_011', 'Hyperlink and Text Markup Language', false, 4),
('opt_045', 'q_012', 'Permanent data storage', false, 1),
('opt_046', 'q_012', 'Temporary data storage', true, 2),
('opt_047', 'q_012', 'Processing data', false, 3),
('opt_048', 'q_012', 'Displaying data', false, 4),
('opt_049', 'q_013', 'A function', false, 1),
('opt_050', 'q_013', 'A container for storing data', true, 2),
('opt_051', 'q_013', 'A loop', false, 3),
('opt_052', 'q_013', 'A condition', false, 4),
('opt_053', 'q_014', 'O(1)', false, 1),
('opt_054', 'q_014', 'O(n)', false, 2),
('opt_055', 'q_014', 'O(log n)', true, 3),
('opt_056', 'q_014', 'O(n²)', false, 4);

-- Insert exams
INSERT INTO exams (id, title, description, exam_category_id, duration, total_marks, passing_marks, price, currency, max_attempts, status, is_active) VALUES
('exam_001', 'Basic Mathematics Test', 'A comprehensive test covering fundamental mathematics concepts', 'cat_001', 60, 10, 6, 9.99, 'USD', 3, 'PUBLISHED', true),
('exam_002', 'Physics Fundamentals', 'Basic physics concepts and principles', 'cat_002', 45, 6, 4, 7.99, 'USD', 2, 'PUBLISHED', true),
('exam_003', 'Chemistry Basics', 'Introduction to chemistry concepts', 'cat_003', 45, 6, 4, 7.99, 'USD', 2, 'PUBLISHED', true),
('exam_004', 'Computer Science Introduction', 'Basic computer science and programming concepts', 'cat_005', 60, 8, 5, 8.99, 'USD', 3, 'PUBLISHED', true),
('exam_005', 'Advanced Mathematics', 'Advanced mathematics including calculus and algebra', 'cat_001', 90, 15, 10, 12.99, 'USD', 2, 'PUBLISHED', true);

-- Insert exam questions (linking exams to questions)
INSERT INTO exam_questions (id, exam_id, question_id, order_index, points) VALUES
('eq_001', 'exam_001', 'q_001', 1, 1),
('eq_002', 'exam_001', 'q_002', 2, 1),
('eq_003', 'exam_001', 'q_003', 3, 1),
('eq_004', 'exam_001', 'q_004', 4, 1),
('eq_005', 'exam_002', 'q_005', 1, 1),
('eq_006', 'exam_002', 'q_006', 2, 1),
('eq_007', 'exam_002', 'q_007', 3, 1),
('eq_008', 'exam_003', 'q_008', 1, 1),
('eq_009', 'exam_003', 'q_009', 2, 1),
('eq_010', 'exam_003', 'q_010', 3, 1),
('eq_011', 'exam_004', 'q_011', 1, 1),
('eq_012', 'exam_004', 'q_012', 2, 1),
('eq_013', 'exam_004', 'q_013', 3, 1),
('eq_014', 'exam_004', 'q_014', 4, 1);

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, title, message, status) VALUES
('notif_001', 'user_004', 'EMAIL', 'Welcome to Exam System', 'Welcome to our advanced exam system!', 'SENT'),
('notif_002', 'user_005', 'EMAIL', 'New Exam Available', 'A new mathematics exam is now available for booking.', 'SENT'),
('notif_003', 'user_006', 'EMAIL', 'Exam Reminder', 'Your scheduled exam is tomorrow at 10:00 AM.', 'PENDING');

-- Insert sample audit logs
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address) VALUES
('audit_001', 'user_001', 'USER_LOGIN', 'users', 'user_001', '127.0.0.1'),
('audit_002', 'user_001', 'EXAM_CREATED', 'exams', 'exam_001', '127.0.0.1'),
('audit_003', 'user_004', 'USER_REGISTERED', 'users', 'user_004', '127.0.0.1'),
('audit_004', 'user_005', 'EXAM_BOOKED', 'exam_bookings', NULL, '127.0.0.1');

-- Insert sample user performances
INSERT INTO user_performances (id, user_id, exam_category_id, total_exams_taken, total_exams_passed, average_score, best_score) VALUES
('perf_001', 'user_004', 'cat_001', 2, 1, 75.50, 85.00),
('perf_002', 'user_005', 'cat_002', 1, 1, 90.00, 90.00),
('perf_003', 'user_006', 'cat_005', 0, 0, 0.00, 0.00);

-- Summary of inserted data
SELECT 'Data insertion completed successfully!' as status;
SELECT 'Exam Categories: ' || COUNT(*) as categories_count FROM exam_categories;
SELECT 'Users: ' || COUNT(*) as users_count FROM users;
SELECT 'Questions: ' || COUNT(*) as questions_count FROM questions;
SELECT 'Exams: ' || COUNT(*) as exams_count FROM exams; 