-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived', 'maintenance');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'single_choice', 'true_false', 'fill_blank', 'essay');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE exam_session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'abandoned', 'expired');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'pending',
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    status exam_status DEFAULT 'draft',
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    total_questions INTEGER NOT NULL DEFAULT 50,
    passing_score INTEGER NOT NULL DEFAULT 70,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    max_attempts INTEGER DEFAULT 1,
    is_randomized BOOLEAN DEFAULT TRUE,
    show_results_immediately BOOLEAN DEFAULT FALSE,
    allow_review BOOLEAN DEFAULT TRUE,
    instructions TEXT,
    tags TEXT[],
    thumbnail_url VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    category_id UUID REFERENCES categories(id),
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    difficulty_level difficulty_level DEFAULT 'medium',
    points INTEGER DEFAULT 1,
    time_limit_seconds INTEGER,
    explanation TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    correct_answer_count INTEGER DEFAULT 0,
    incorrect_answer_count INTEGER DEFAULT 0,
    average_time_spent DECIMAL(10,2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Question options table
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question images table
CREATE TABLE question_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam sessions table
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    user_id UUID REFERENCES users(id),
    status exam_session_status DEFAULT 'scheduled',
    scheduled_start TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    score INTEGER,
    percentage_score DECIMAL(5,2),
    is_passed BOOLEAN,
    ip_address INET,
    user_agent TEXT,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session questions table (for tracking which questions were shown)
CREATE TABLE session_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    exam_id UUID REFERENCES exams(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    exam_id UUID REFERENCES exams(id),
    payment_id UUID REFERENCES payments(id),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    attempts_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_by ON users(created_by);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

CREATE INDEX idx_exams_category_id ON exams(category_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_price ON exams(price);

CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_is_active ON questions(is_active);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_options_is_correct ON question_options(is_correct);

CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_scheduled_start ON exam_sessions(scheduled_start);

CREATE INDEX idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX idx_session_questions_question_id ON session_questions(question_id);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_exam_id ON payments(exam_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_exam_id ON user_subscriptions(exam_id);
CREATE INDEX idx_user_subscriptions_valid_until ON user_subscriptions(valid_until);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_question_options_updated_at BEFORE UPDATE ON question_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('min_question_overlap_percentage', '5', 'integer', 'Minimum percentage of questions that can overlap between exams', true),
('max_question_overlap_percentage', '15', 'integer', 'Maximum percentage of questions that can overlap between exams', true),
('default_exam_duration', '120', 'integer', 'Default exam duration in minutes', true),
('max_exam_duration', '300', 'integer', 'Maximum allowed exam duration in minutes', true),
('default_questions_per_exam', '50', 'integer', 'Default number of questions per exam', true),
('max_questions_per_exam', '200', 'integer', 'Maximum number of questions per exam', true),
('question_randomization_algorithm', 'weighted_random', 'string', 'Algorithm used for question randomization', false),
('enable_question_banking', 'true', 'boolean', 'Enable question banking feature', true),
('enable_adaptive_testing', 'false', 'boolean', 'Enable adaptive testing based on difficulty', true),
('enable_anti_cheating', 'true', 'boolean', 'Enable anti-cheating measures', true),
('session_timeout_minutes', '30', 'integer', 'Session timeout in minutes', true),
('max_concurrent_sessions', '1', 'integer', 'Maximum concurrent exam sessions per user', true); 