-- ─── Supabase RLS Policies ────────────────────────────────────────────────────
-- Run this once in the Supabase SQL editor.
-- Enables Row Level Security so PostgREST enforces data access per user.

-- ─── Helper functions ─────────────────────────────────────────────────────────

-- Returns true if the current JWT belongs to a super_admin user
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND role_type = 'super_admin'
  );
$$;

-- Returns community IDs the current user manages (community_admin, community_manager, or legacy manager)
CREATE OR REPLACE FUNCTION public.get_managed_community_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT m.community_id
    FROM public.memberships m
    JOIN public.users u ON u.id = m.user_id
    WHERE u.auth_user_id = auth.uid()
      AND m.approval_status = 'approved'
      AND m.role_type IN ('community_admin', 'community_manager', 'manager')
  );
$$;

-- ─── communities ──────────────────────────────────────────────────────────────

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read their communities"
  ON public.communities FOR SELECT
  USING (
    public.is_super_admin()
    OR id = ANY(public.get_managed_community_ids())
  );

-- ─── units ────────────────────────────────────────────────────────────────────

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read units in their communities"
  ON public.units FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── memberships ──────────────────────────────────────────────────────────────

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read memberships in their communities"
  ON public.memberships FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── access_logs ──────────────────────────────────────────────────────────────

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read access logs in their communities"
  ON public.access_logs FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── scanners ─────────────────────────────────────────────────────────────────

ALTER TABLE public.scanners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read scanners in their communities"
  ON public.scanners FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── announcements ────────────────────────────────────────────────────────────

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read announcements in their communities"
  ON public.announcements FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── service_requests ─────────────────────────────────────────────────────────

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read service requests in their communities"
  ON public.service_requests FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── community_policies ───────────────────────────────────────────────────────

ALTER TABLE public.community_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read policies for their communities"
  ON public.community_policies FOR SELECT
  USING (
    public.is_super_admin()
    OR community_id = ANY(public.get_managed_community_ids())
  );

-- ─── users (read own profile + all users for super_admin) ────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile"
  ON public.users FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR public.is_super_admin()
  );

-- Allow managers to see users who are members of their communities
CREATE POLICY "managers read members in their communities"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = users.id
        AND m.community_id = ANY(public.get_managed_community_ids())
    )
  );
