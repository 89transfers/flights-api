export const cleanText = (text: string): string => {
  const parts = text.split(/\s+/);
  const seen = new Set<string>();
  const unique = parts.filter(part => {
    if (!seen.has(part)) {
      seen.add(part);
      return true;
    }
    return false;
  });
  return unique.join(' ').trim();
};

export const parseDuration = (duration: string): number => {
  const cleaned = cleanText(duration);
  const parts = cleaned.split(' ');
  let total = 0;

  for (let i = 0; i < parts.length - 1; i += 2) {
    const num = parseInt(parts[i], 10);
    const unit = parts[i + 1].toLowerCase();

    if (unit.startsWith('hr')) {
      total += num * 60;
    } else if (unit.startsWith('min')) {
      total += num;
    }
  }

  return total;
};

export const extractLogoUrl = (style: string): string => {
  const urlMatch = style.match(/url\((.*?)\)/);
  return urlMatch ? urlMatch[1].replace(/['"]/g, '') : '';
};

export const parseTime = (timeStr: string): Date => {
  const date = new Date();
  const [hours, minutes] = timeStr.split(':');
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const parseAmPmTime = (timeStr: string): string => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const extractFlightNumber = (url: string): string => {
  const parts = url.split('-');
  return parts.length > 3 ? `${parts[2]} ${parts[3]}` : '';
};