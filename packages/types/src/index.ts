// ─── Enums ───────────────────────────────────────────────────────────────────

export enum RelationshipType {
  Owner = 'owner',
  Family = 'family',
  Tenant = 'tenant',
  Staff = 'staff',
}

export enum GlobalRoleType {
  SuperAdmin = 'super_admin',
  User = 'user',
}

export enum RoleType {
  // Legacy — kept for backward compatibility during migration
  Manager = 'manager',
  // Community membership roles
  CommunityAdmin = 'community_admin',
  CommunityManager = 'community_manager',
  Staff = 'staff',
  Gatekeeper = 'gatekeeper',
  Resident = 'resident',
}

export enum UserStatus {
  Active = 'active',
  Invited = 'invited',
  Suspended = 'suspended',
}

export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Suspended = 'suspended',
}

export enum PassType {
  Guest = 'guest',
  Delivery = 'delivery',
  ServiceProvider = 'service_provider',
}

export enum PassStatus {
  Active = 'active',
  Used = 'used',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum ScanResult {
  Granted = 'granted',
  Denied = 'denied',
}

export enum ScanType {
  Resident = 'resident',
  Guest = 'guest',
}

export enum CommunityType {
  Residential = 'residential',
}

export enum ServiceRequestStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum AnnouncementStatus {
  Draft = 'draft',
  Published = 'published',
}

// ─── QR Token Payload ─────────────────────────────────────────────────────────

export interface ResidentQrPayload {
  sub: string;        // user_id
  type: 'resident_access';
  iat: number;
  exp: number;
}

export interface GuestPassQrPayload {
  sub: string;        // guest_pass_id
  type: 'guest_access';
  v: number;          // qr_token_version
  iat: number;
  exp: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  phone_number: string;
  full_name: string | null;
  profile_photo_url: string | null;
  status: UserStatus;
  role_type: GlobalRoleType;
  created_at: string;
}

export interface ApiCommunity {
  id: string;
  name: string;
  slug: string | null;
  type: CommunityType;
  status: string;
}

export interface ApiUnit {
  id: string;
  community_id: string;
  unit_code: string;
  unit_type: string | null;
  floor: string | null;
  building: string | null;
  created_at: string;
}

export interface ApiMembership {
  id: string;
  user_id: string;
  community_id: string;
  unit_id: string | null;
  relationship_type: RelationshipType | null;
  role_type: RoleType | null;
  approval_status: ApprovalStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  // Nested (included in some responses)
  user?: Pick<ApiUser, 'full_name' | 'phone_number' | 'profile_photo_url' | 'status'>;
  unit?: Pick<ApiUnit, 'unit_code'>;
}

export interface ApiGuestPass {
  id: string;
  community_id: string;
  host_user_id: string;
  guest_name: string;
  guest_phone: string;
  pass_type: PassType;
  status: PassStatus;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  usage_count: number;
  created_at: string;
}

export interface ApiAnnouncement {
  id: string;
  community_id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  published_by: string | null;
  published_at: string | null;
  status: AnnouncementStatus;
  created_at?: string;
}

export interface ApiServiceRequest {
  id: string;
  community_id: string;
  user_id: string;
  membership_id: string | null;
  category: string | null;
  subject: string | null;
  description: string | null;
  status: ServiceRequestStatus;
  assigned_to: string | null;
  created_at: string;
  user?: Pick<ApiUser, 'full_name' | 'phone_number'>;
}

export interface ApiScanner {
  id: string;
  community_id: string;
  scanner_name: string | null;
  scanner_code: string;
  location_label: string | null;
  is_active: boolean;
  assigned_user_id: string | null;
  created_at: string;
}

export interface ApiAccessLog {
  id: string;
  community_id: string | null;
  scanner_code: string | null;
  scan_type: ScanType | null;
  resident_name: string | null;
  resident_phone: string | null;
  unit_code: string | null;
  result: ScanResult;
  denial_reason: string | null;
  scanned_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthVerifyOtpResponse {
  access_token: string;
  user: ApiUser;
}

export interface AuthMeResponse {
  user: ApiUser;
  memberships: ApiMembership[];
}

// ─── Scan Validation ──────────────────────────────────────────────────────────

export interface ScanValidationResult {
  result: ScanResult;
  denial_reason?: string;
  // Resident scan
  resident_name?: string;
  unit_code?: string;
  photo_url?: string;
  community_name?: string;
  // Guest scan
  guest_name?: string;
  host_name?: string;
  host_unit?: string;
}

// ─── Guest Pass Create ────────────────────────────────────────────────────────

export interface CreateGuestPassRequest {
  community_id: string;
  guest_name: string;
  guest_phone: string;
  pass_type: PassType;
}

export interface CreateGuestPassResponse {
  id: string;
  pass_type: PassType;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  pass_url: string;
}

// ─── Admin: Overview ─────────────────────────────────────────────────────────

export interface ApiAdminOverview {
  total_communities: number;
  total_members: number;
  pending_memberships: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Standard paginated list response envelope returned by all admin list endpoints */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
