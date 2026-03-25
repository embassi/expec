"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementStatus = exports.ServiceRequestStatus = exports.CommunityType = exports.ScanType = exports.ScanResult = exports.PassStatus = exports.PassType = exports.ApprovalStatus = exports.RoleType = exports.RelationshipType = void 0;
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["Owner"] = "owner";
    RelationshipType["Family"] = "family";
    RelationshipType["Tenant"] = "tenant";
    RelationshipType["Staff"] = "staff";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var RoleType;
(function (RoleType) {
    RoleType["Manager"] = "manager";
    RoleType["Resident"] = "resident";
})(RoleType || (exports.RoleType = RoleType = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["Pending"] = "pending";
    ApprovalStatus["Approved"] = "approved";
    ApprovalStatus["Rejected"] = "rejected";
    ApprovalStatus["Suspended"] = "suspended";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var PassType;
(function (PassType) {
    PassType["Guest"] = "guest";
    PassType["Delivery"] = "delivery";
    PassType["ServiceProvider"] = "service_provider";
})(PassType || (exports.PassType = PassType = {}));
var PassStatus;
(function (PassStatus) {
    PassStatus["Active"] = "active";
    PassStatus["Used"] = "used";
    PassStatus["Expired"] = "expired";
    PassStatus["Cancelled"] = "cancelled";
})(PassStatus || (exports.PassStatus = PassStatus = {}));
var ScanResult;
(function (ScanResult) {
    ScanResult["Granted"] = "granted";
    ScanResult["Denied"] = "denied";
})(ScanResult || (exports.ScanResult = ScanResult = {}));
var ScanType;
(function (ScanType) {
    ScanType["Resident"] = "resident";
    ScanType["Guest"] = "guest";
})(ScanType || (exports.ScanType = ScanType = {}));
var CommunityType;
(function (CommunityType) {
    CommunityType["Residential"] = "residential";
})(CommunityType || (exports.CommunityType = CommunityType = {}));
var ServiceRequestStatus;
(function (ServiceRequestStatus) {
    ServiceRequestStatus["Open"] = "open";
    ServiceRequestStatus["InProgress"] = "in_progress";
    ServiceRequestStatus["Resolved"] = "resolved";
    ServiceRequestStatus["Closed"] = "closed";
})(ServiceRequestStatus || (exports.ServiceRequestStatus = ServiceRequestStatus = {}));
var AnnouncementStatus;
(function (AnnouncementStatus) {
    AnnouncementStatus["Draft"] = "draft";
    AnnouncementStatus["Published"] = "published";
})(AnnouncementStatus || (exports.AnnouncementStatus = AnnouncementStatus = {}));
//# sourceMappingURL=index.js.map