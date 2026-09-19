-- V4 admin hash did not match the documented password admin1234.
UPDATE admins
SET password_hash = '$2b$10$7VB1iWsmxeLHFDTVaD2Zd.eGd9WYvKUPr8BKk45/oH1plZcbgOOSK'
WHERE username = 'admin';
