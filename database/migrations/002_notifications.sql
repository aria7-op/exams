-- Create notification-related enums
CREATE TYPE notification_type AS ENUM (
  'USER_REGISTERED',
  'EMAIL_VERIFIED', 
  'ACCOUNT_STATUS_CHANGED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'EXAM_STARTED',
  'EXAM_COMPLETED',
  'CERTIFICATE_READY',
  'EXAM_REMINDER',
  'SYSTEM_ALERT',
  'NEW_USER_REGISTERED'
);

CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'DISMISSED');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority notification_priority DEFAULT 'normal',
    status notification_status DEFAULT 'UNREAD',
    schedule_at TIMESTAMP,
    expires_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    websocket_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    -- Notification type preferences
    booking_notifications BOOLEAN DEFAULT TRUE,
    exam_notifications BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification delivery log (for tracking delivery attempts)
CREATE TABLE notification_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- 'email', 'websocket', 'push', 'sms'
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'delivered', 'bounced'
    error_message TEXT,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notification_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX idx_notification_delivery_log_channel ON notification_delivery_log(channel);

-- Update trigger for notifications
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at();