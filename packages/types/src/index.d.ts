export declare enum RelationshipType {
    Owner = "owner",
    Family = "family",
    Tenant = "tenant",
    Staff = "staff"
}
export declare enum RoleType {
    Manager = "manager",
    Resident = "resident"
}
export declare enum ApprovalStatus {
    Pending = "pending",
    Approved = "approved",
    Rejected = "rejected",
    Suspended = "suspended"
}
export declare enum PassType {
    Guest = "guest",
    Delivery = "delivery",
    ServiceProvider = "service_provider"
}
export declare enum PassStatus {
    Active = "active",
    Used = "used",
    Expired = "expired",
    Cancelled = "cancelled"
}
export declare enum ScanResult {
    Granted = "granted",
    Denied = "denied"
}
export declare enum ScanType {
    Resident = "resident",
    Guest = "guest"
}
export declare enum CommunityType {
    Residential = "residential"
}
export declare enum ServiceRequestStatus {
    Open = "open",
    InProgress = "in_progress",
    Resolved = "resolved",
    Closed = "closed"
}
export declare enum AnnouncementStatus {
    Draft = "draft",
    Published = "published"
}
export interface ResidentQrPayload {
    sub: string;
    type: 'resident_access';
    iat: number;
    exp: number;
}
export interface GuestPassQrPayload {
    sub: string;
    type: 'guest_access';
    v: number;
    iat: number;
    exp: number;
}
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
    resident_name?: string;
    unit_code?: string;
    photo_url?: string;
    community_name?: string;
    guest_name?: string;
    host_name?: string;
    host_unit?: string;
}
