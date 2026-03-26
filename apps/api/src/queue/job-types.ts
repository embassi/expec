// Typed payloads for each queue job — kept here to avoid circular imports

export interface SendOtpJobData {
  phoneNumber: string;
  otp: string;
}

export interface SendGuestPassJobData {
  guestPhone: string;
  guestName: string;
  passUrl: string;
  passType: string;
}

export interface SendWelcomeJobData {
  phoneNumber: string;
  communityName: string;
}
