DELETE FROM blog_likes
WHERE blog_id IN (SELECT id FROM blogs WHERE published_at IS NULL);

DELETE FROM blog_comments
WHERE parent_comment_id IS NOT NULL
  AND blog_id IN (SELECT id FROM blogs WHERE published_at IS NULL);

DELETE FROM blog_comments
WHERE blog_id IN (SELECT id FROM blogs WHERE published_at IS NULL);

DELETE FROM blog_images
WHERE blog_id IN (SELECT id FROM blogs WHERE published_at IS NULL);

DELETE FROM blogs
WHERE published_at IS NULL;

ALTER TABLE blogs DROP COLUMN published_at;
