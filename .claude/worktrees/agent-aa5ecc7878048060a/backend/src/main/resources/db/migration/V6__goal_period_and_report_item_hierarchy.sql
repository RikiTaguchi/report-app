-- 目標: 期限(target_date) -> 期間(start_date/end_date)
ALTER TABLE goals ADD COLUMN start_date DATE;
ALTER TABLE goals ADD COLUMN end_date DATE;
ALTER TABLE goals ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE goals ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE goals ADD CONSTRAINT goals_period_valid CHECK (end_date >= start_date);
ALTER TABLE goals DROP COLUMN target_date;

-- 日報項目の階層化: 目標(親要素/期間は目標を継承) -> サブタイトル -> 項目
CREATE TABLE report_item_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    goal_id UUID NOT NULL UNIQUE REFERENCES goals(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_item_subtitles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES report_item_groups(id),
    label VARCHAR(255) NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE report_item_definitions ADD COLUMN subtitle_id UUID REFERENCES report_item_subtitles(id);
ALTER TABLE report_item_definitions ALTER COLUMN subtitle_id SET NOT NULL;
ALTER TABLE report_item_definitions DROP COLUMN student_id;

CREATE TRIGGER trg_report_item_groups_updated_at BEFORE UPDATE ON report_item_groups
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_item_subtitles_updated_at BEFORE UPDATE ON report_item_subtitles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 管理者による生徒削除時のカスケード削除を可能にする
ALTER TABLE goals DROP CONSTRAINT goals_student_id_fkey;
ALTER TABLE goals ADD CONSTRAINT goals_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE goal_progresses DROP CONSTRAINT goal_progresses_goal_id_fkey;
ALTER TABLE goal_progresses ADD CONSTRAINT goal_progresses_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;

ALTER TABLE report_item_groups DROP CONSTRAINT report_item_groups_student_id_fkey;
ALTER TABLE report_item_groups ADD CONSTRAINT report_item_groups_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE report_item_groups DROP CONSTRAINT report_item_groups_goal_id_fkey;
ALTER TABLE report_item_groups ADD CONSTRAINT report_item_groups_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;

ALTER TABLE report_item_subtitles DROP CONSTRAINT report_item_subtitles_group_id_fkey;
ALTER TABLE report_item_subtitles ADD CONSTRAINT report_item_subtitles_group_id_fkey FOREIGN KEY (group_id) REFERENCES report_item_groups(id) ON DELETE CASCADE;

ALTER TABLE report_item_definitions DROP CONSTRAINT report_item_definitions_subtitle_id_fkey;
ALTER TABLE report_item_definitions ADD CONSTRAINT report_item_definitions_subtitle_id_fkey FOREIGN KEY (subtitle_id) REFERENCES report_item_subtitles(id) ON DELETE CASCADE;

ALTER TABLE daily_reports DROP CONSTRAINT daily_reports_student_id_fkey;
ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE report_item_responses DROP CONSTRAINT report_item_responses_daily_report_id_fkey;
ALTER TABLE report_item_responses ADD CONSTRAINT report_item_responses_daily_report_id_fkey FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;
ALTER TABLE report_item_responses DROP CONSTRAINT report_item_responses_report_item_definition_id_fkey;
ALTER TABLE report_item_responses ADD CONSTRAINT report_item_responses_report_item_definition_id_fkey FOREIGN KEY (report_item_definition_id) REFERENCES report_item_definitions(id) ON DELETE CASCADE;

ALTER TABLE study_time_records DROP CONSTRAINT study_time_records_daily_report_id_fkey;
ALTER TABLE study_time_records ADD CONSTRAINT study_time_records_daily_report_id_fkey FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;

ALTER TABLE report_images DROP CONSTRAINT report_images_daily_report_id_fkey;
ALTER TABLE report_images ADD CONSTRAINT report_images_daily_report_id_fkey FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;

ALTER TABLE report_comments DROP CONSTRAINT report_comments_daily_report_id_fkey;
ALTER TABLE report_comments ADD CONSTRAINT report_comments_daily_report_id_fkey FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;

ALTER TABLE report_likes DROP CONSTRAINT report_likes_daily_report_id_fkey;
ALTER TABLE report_likes ADD CONSTRAINT report_likes_daily_report_id_fkey FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;
