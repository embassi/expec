// ─── Enums ───────────────────────────────────────────────────────────────────

export enum RelationshipType {
  Owner = 'owner',
  Family = 'family',
  Tenant = 'tenant',
  Staff = 'staff',
}

export enum RoleType {
  Manager = 'manager',
  Resident = 'resident',
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
  status: string;
  created_at: string;
}

export interface ApiCommunity {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  status: string;
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
}

export interface ApiUnit {
  id: string;
  community_id: string;
  unit_code: string;
  unit_type: string | null;
  created_at: string;
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
