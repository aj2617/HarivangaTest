const shortMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

const longDayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const mediumDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const orderTimestampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatShortMonthDay(date: Date) {
  return shortMonthDayFormatter.format(date);
}

export function formatLongDate(date: Date) {
  return longDayFormatter.format(date);
}

export function formatMediumDate(date: Date) {
  return mediumDateFormatter.format(date);
}

export function formatOrderTimestamp(date: Date) {
  return orderTimestampFormatter.format(date);
}
