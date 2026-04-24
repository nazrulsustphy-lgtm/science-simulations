-- ═══════════════════════════════════════════════════════════════
-- SCISIM DATABASE MIGRATION v2
-- Run this in Supabase SQL Editor AFTER initial setup
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add is_admin column to users ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ── 2. Add monthly_reset_at column for counter reset tracking ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ── 3. Add DELETE policy for comments (users can delete own) ──
CREATE POLICY IF NOT EXISTS "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. Add DELETE policies for GDPR account deletion ──
CREATE POLICY IF NOT EXISTS "Users can delete own data from users"
  ON users FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can delete own views"
  ON simulation_views FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own quiz results"
  ON quiz_results FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own requests"
  ON request_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ── 5. Comment likes increment RPC function ──
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE comments SET likes = COALESCE(likes, 0) + 1 WHERE id = comment_id;
END;
$$;

-- ── 6. Grant execute permission ──
GRANT EXECUTE ON FUNCTION increment_comment_likes TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- MAKE YOURSELF ADMIN
-- Replace 'your@email.com' with your actual email
-- ═══════════════════════════════════════════════════════════════
-- UPDATE users SET is_admin = true WHERE email = 'your@email.com';

-- ═══════════════════════════════════════════════════════════════
-- VERIFY MIGRATIONS
-- Run these to check everything worked:
-- ═══════════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_admin', 'monthly_reset_at');
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename = 'comments';
