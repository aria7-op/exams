-- Advanced Exam System Database Schema
-- This matches our Prisma schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'STUDENT');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'ESSAY');
CREATE TYPE question_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE exam_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMED_OUT');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE notification_type AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    status user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    last_login TIMESTAMP,
    profile_picture VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Categories table
CREATE TABLE exam_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    type question_type NOT NULL,
    difficulty question_difficulty NOT NULL,
    exam_category_id UUID NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    time_limit INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Options table
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_category_id UUID NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    max_attempts INTEGER DEFAULT 1,
    retake_delay_hours INTEGER DEFAULT 0,
    status exam_status DEFAULT 'DRAFT',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Questions (Many-to-Many)
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, question_id)
);

-- Exam Bookings table
CREATE TABLE exam_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    status booking_status DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'PENDING',
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Attempts table
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES exam_bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status attempt_status DEFAULT 'IN_PROGRESS',
    total_score INTEGER DEFAULT 0,
    passing_score INTEGER,
    percentage_score DECIMAL(5,2),
    time_taken INTEGER, -- in minutes
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Scores table
CREATE TABLE question_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_taken INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Scores table
CREATE TABLE exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    unanswered_questions INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    earned_points INTEGER DEFAULT 0,
    percentage_score DECIMAL(5,2),
    grade VARCHAR(2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Performance table
CREATE TABLE user_performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_category_id UUID REFERENCES exam_categories(id) ON DELETE SET NULL,
    total_exams_taken INTEGER DEFAULT 0,
    total_exams_passed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    total_time_spent INTEGER DEFAULT 0, -- in minutes
    last_exam_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES exam_bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(255),
    status payment_status DEFAULT 'PENDING',
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    grade VARCHAR(2),
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    certificate_url VARCHAR(500),
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'PENDING',
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    exam_category_id UUID REFERENCES exam_categories(id) ON DELETE SET NULL,
    max_members INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Group Members (Many-to-Many)
CREATE TABLE study_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER', -- ADMIN, MODERATOR, MEMBER
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(study_group_id, user_id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_questions_category ON questions(exam_category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_exams_category ON exams(exam_category_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_bookings_user ON exam_bookings(user_id);
CREATE INDEX idx_bookings_exam ON exam_bookings(exam_id);
CREATE INDEX idx_bookings_status ON exam_bookings(status);
CREATE INDEX idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_status ON exam_attempts(status);
CREATE INDEX idx_question_scores_attempt ON question_scores(attempt_id);
CREATE INDEX idx_exam_scores_attempt ON exam_scores(attempt_id);
CREATE INDEX idx_user_performances_user ON user_performances(user_id);
CREATE INDEX idx_user_performances_category ON user_performances(exam_category_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_categories_updated_at BEFORE UPDATE ON exam_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_bookings_updated_at BEFORE UPDATE ON exam_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_attempts_updated_at BEFORE UPDATE ON exam_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_performances_updated_at BEFORE UPDATE ON user_performances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 