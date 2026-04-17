// DSE trading hours: Sunday–Thursday, 10:00 AM – 2:30 PM Asia/Dhaka (UTC+6, no DST).
export function isDseMarketOpen(lastUpdated: Date | string | null | undefined): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');

  const tradingDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  if (!tradingDays.includes(weekday)) return false;

  const minutesNow = hour * 60 + minute;
  const openAt = 10 * 60;        // 10:00
  const closeAt = 14 * 60 + 30;  // 14:30
  if (minutesNow < openAt || minutesNow >= closeAt) return false;

  if (!lastUpdated) return false;
  const last = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const ageMin = (Date.now() - last.getTime()) / 60000;
  return ageMin < 10;
}
