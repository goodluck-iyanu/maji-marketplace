-- Add manual tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS theyutes_shipment_id text,
ADD COLUMN IF NOT EXISTS theyutes_tracking_id text,
ADD COLUMN IF NOT EXISTS theyutes_tracking_url text,
ADD COLUMN IF NOT EXISTS theyutes_carrier text,
ADD COLUMN IF NOT EXISTS theyutes_eta text,
ADD COLUMN IF NOT EXISTS tracking_added_at timestamptz,
ADD COLUMN IF NOT EXISTS tracking_updated_at timestamptz;
