/** Common IANA timezones for profile settings */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const TIMEZONE_LABELS: Record<string, string> = {
  "Asia/Karachi": "Asia/Karachi (Pakistan, PKT)",
  "Asia/Kolkata": "Asia/Kolkata (India, IST)",
  "Asia/Dhaka": "Asia/Dhaka (Bangladesh)",
  "Asia/Dubai": "Asia/Dubai (UAE)",
};

export function formatUserLocalTime(timezone?: string | null): string {
  const tz = timezone?.trim() || "UTC";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  }
}
