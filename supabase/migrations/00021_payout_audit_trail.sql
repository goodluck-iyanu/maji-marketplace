-- Extend payout_change_requests to include an audit trail
ALTER TABLE public.payout_change_requests
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS previous_account_data JSONB;
