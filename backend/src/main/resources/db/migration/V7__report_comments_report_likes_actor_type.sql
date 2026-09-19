ALTER TABLE report_comments ADD COLUMN author_type VARCHAR(20);
ALTER TABLE report_comments ADD COLUMN author_id UUID;
UPDATE report_comments SET author_type = 'TEACHER', author_id = teacher_id;
ALTER TABLE report_comments ALTER COLUMN author_type SET NOT NULL;
ALTER TABLE report_comments ALTER COLUMN author_id SET NOT NULL;
ALTER TABLE report_comments ADD CONSTRAINT report_comments_author_type_check CHECK (author_type IN ('STUDENT', 'TEACHER'));
ALTER TABLE report_comments DROP COLUMN teacher_id;

ALTER TABLE report_likes ADD COLUMN liker_type VARCHAR(20);
ALTER TABLE report_likes ADD COLUMN liker_id UUID;
UPDATE report_likes SET liker_type = 'TEACHER', liker_id = teacher_id;
ALTER TABLE report_likes ALTER COLUMN liker_type SET NOT NULL;
ALTER TABLE report_likes ALTER COLUMN liker_id SET NOT NULL;
ALTER TABLE report_likes ADD CONSTRAINT report_likes_liker_type_check CHECK (liker_type IN ('STUDENT', 'TEACHER'));
ALTER TABLE report_likes DROP COLUMN teacher_id;
ALTER TABLE report_likes ADD CONSTRAINT report_likes_unique UNIQUE (daily_report_id, liker_type, liker_id);
