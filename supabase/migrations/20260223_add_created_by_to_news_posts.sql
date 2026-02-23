-- Add created_by column to news_posts to track who posted
ALTER TABLE news_posts
ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
