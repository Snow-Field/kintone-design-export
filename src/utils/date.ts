const pad = (v: number) => {
  String(v).padStart(2, "0");
};

export function getFormattedDate() {
  const now = new Date();
  const parts = {
    year: now.getFullYear(),
    month: pad(now.getMonth() + 1),
    day: pad(now.getDate()),
    hours: pad(now.getHours()),
    minutes: pad(now.getMinutes()),
    seconds: pad(now.getSeconds()),
  };

  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const tzHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const tzMinutes = pad(Math.abs(offsetMinutes) % 60);
  const timezone = `${sign}${tzHours}${tzMinutes}`;

  return `${parts.year}${parts.month}${parts.day}T${parts.hours}${parts.minutes}${parts.seconds}${timezone}`;
}
