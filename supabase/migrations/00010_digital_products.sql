-- Add digital product fields to the products table
ALTER TABLE public.products
ADD COLUMN digital_file_id TEXT, -- The Google Drive file ID
ADD COLUMN digital_file_size TEXT, -- Formatted size (e.g. "183 MB")
ADD COLUMN downloads_allowed INTEGER DEFAULT -1, -- -1 means unlimited
ADD COLUMN digital_format TEXT; -- e.g. "PDF", "EPUB"

