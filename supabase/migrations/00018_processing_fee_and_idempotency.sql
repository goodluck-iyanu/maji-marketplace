-- Migration 00018: Add processing_fee column and idempotency guard
-- Safe to run on database where 00017 has already been executed.
-- Does NOT modify or drop any existing data.

-- 1. Add processing_fee column to orders (for the customer-facing payment processing surcharge)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12, 2) DEFAULT 0;

-- 2. Add unique constraint on financial_transactions to prevent duplicate ledger entries
--    from webhook retries. Each (order_id, transaction_type) pair must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_order_type
    ON public.financial_transactions (order_id, transaction_type);

-- 3. Add a regular index on order_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id
    ON public.financial_transactions (order_id);
