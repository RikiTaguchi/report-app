-- Report items are checkbox-only. Delete legacy TEXT data before dropping the columns.
DELETE FROM report_item_responses
WHERE report_item_definition_id IN (
    SELECT id FROM report_item_definitions WHERE item_type = 'TEXT'
);
DELETE FROM report_item_definitions WHERE item_type = 'TEXT';

-- Keep empty subtitles: zero-item goal periods remain valid and submittable.
ALTER TABLE report_item_definitions DROP COLUMN IF EXISTS item_type;
ALTER TABLE report_item_responses DROP COLUMN IF EXISTS text_value;
