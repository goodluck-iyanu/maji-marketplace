-- Migration: Add email tracking and logistics columns to orders table
-- These columns support:
-- 1. Idempotent email sending (confirmation_email_sent)
-- 2. Future Theyutes logistics integration (logistics_*)

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false;

-- Logistics columns for future Theyutes API integration
-- These are deliberately nullable — they will remain NULL until the real API is connected
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_provider TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_tracking_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_events JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_estimated_delivery TIMESTAMPTZ;
