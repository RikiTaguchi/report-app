CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_item_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('CHECKBOX', 'TEXT')),
    label VARCHAR(255) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    report_date DATE NOT NULL,
    achievement_text TEXT,
    reflection_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (student_id, report_date)
);

CREATE TABLE report_item_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id),
    report_item_definition_id UUID NOT NULL REFERENCES report_item_definitions(id),
    checked BOOLEAN,
    text_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (daily_report_id, report_item_definition_id)
);

CREATE TABLE study_time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    minutes INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (daily_report_id, subject_id)
);

CREATE TABLE report_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id),
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (daily_report_id, teacher_id)
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE goal_progresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id),
    progress_percent INT NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
    comment TEXT,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE blog_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES blogs(id),
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES blogs(id),
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('STUDENT', 'TEACHER')),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES blog_comments(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE blog_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES blogs(id),
    liker_type VARCHAR(20) NOT NULL CHECK (liker_type IN ('STUDENT', 'TEACHER')),
    liker_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (blog_id, liker_type, liker_id)
);

CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_item_definitions_updated_at BEFORE UPDATE ON report_item_definitions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_daily_reports_updated_at BEFORE UPDATE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_item_responses_updated_at BEFORE UPDATE ON report_item_responses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_study_time_records_updated_at BEFORE UPDATE ON study_time_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_images_updated_at BEFORE UPDATE ON report_images
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_comments_updated_at BEFORE UPDATE ON report_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_likes_updated_at BEFORE UPDATE ON report_likes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_goal_progresses_updated_at BEFORE UPDATE ON goal_progresses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_blog_images_updated_at BEFORE UPDATE ON blog_images
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_blog_comments_updated_at BEFORE UPDATE ON blog_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_blog_likes_updated_at BEFORE UPDATE ON blog_likes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
