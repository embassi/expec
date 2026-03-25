import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional() @IsBoolean() owner_added_members_require_approval?: boolean;
  @IsOptional() @IsInt() @Min(0) max_family_members_per_unit?: number;
  @IsOptional() @IsInt() @Min(0) max_staff_members_per_unit?: number;
  @IsOptional() @IsBoolean() allow_tenants?: boolean;
  @IsOptional() @IsBoolean() tenant_requires_approval?: boolean;
  @IsOptional() @IsInt() @Min(1) max_active_guest_passes_per_host?: number;
  @IsOptional() @IsInt() @Min(1) max_guest_passes_per_day?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_guest_duration_hours?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_guest_usage_limit?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_delivery_duration_hours?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_delivery_usage_limit?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_service_duration_hours?: number;
  @IsOptional() @IsInt() @Min(1) guest_pass_service_usage_limit?: number;
  @IsOptional() @IsBoolean() family_can_generate_guest_passes?: boolean;
  @IsOptional() @IsBoolean() tenant_can_generate_guest_passes?: boolean;
  @IsOptional() @IsBoolean() staff_can_generate_guest_passes?: boolean;
}
