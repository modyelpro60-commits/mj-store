-- Add verified flag to profiles for the Verified Customer system.
-- Once a user completes their first order, verified is set to true automatically.
-- Admins can also manually verify/unverify via /admin/users.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
