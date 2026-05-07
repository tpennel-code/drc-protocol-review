-- Allow reviewers to upload an annotated/marked-up document with their review
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS attachment_path text;
