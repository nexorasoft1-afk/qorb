export const APP_NAME = "قُرب";

export const DEFAULT_CITY = "شرم الشيخ";

export const DEFAULT_SEARCH_RADIUS = 5000;

export const MAX_NEARBY_RESULTS = 50;

export const USER_ROLES = {
  USER: "User",
  BUSINESS_OWNER: "BusinessOwner",
  ADMIN: "Admin",
} as const;

export const BUSINESS_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
} as const;

export const EVENT_TYPES = {
  VIEW: "View",
  PHONE: "PhoneClick",
  WHATSAPP: "WhatsAppClick",
  DIRECTIONS: "DirectionsClick",
  WEBSITE: "WebsiteClick",
} as const;