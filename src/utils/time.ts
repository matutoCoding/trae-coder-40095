import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (time: string | Date, format = 'HH:mm'): string => {
  return dayjs(time).format(format);
};

export const formatDateTime = (datetime: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(datetime).format(format);
};

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getTodayDisplay = (): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = dayjs();
  return `${today.format('MM月DD日')} ${weekdays[today.day()]}`;
};

export const getDateList = (days = 7): Array<{ date: string; display: string; weekday: string; isToday: boolean }> => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const result = [];
  const today = dayjs();

  for (let i = 0; i < days; i++) {
    const date = today.add(i, 'day');
    result.push({
      date: date.format('YYYY-MM-DD'),
      display: date.format('MM/DD'),
      weekday: weekdays[date.day()],
      isToday: i === 0
    });
  }

  return result;
};

export const isTimeExpired = (time: string | Date): boolean => {
  return dayjs(time).isBefore(dayjs());
};

export const getTimeDiff = (start: string | Date, end: string | Date, unit: dayjs.UnitType = 'minute'): number => {
  return dayjs(end).diff(dayjs(start), unit);
};

export const addMinutes = (time: string | Date, minutes: number): string => {
  return dayjs(time).add(minutes, 'minute').format('YYYY-MM-DD HH:mm:ss');
};

export const generateTimeSlots = (
  startHour = 9,
  endHour = 22,
  duration = 60,
  capacity = 5
): Array<{ id: string; startTime: string; endTime: string; capacity: number; bookedCount: number; waitlistCount: number; status: string }> => {
  const slots = [];
  let currentHour = startHour;
  let currentMinute = 0;

  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    currentMinute += duration;
    while (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
    
    const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    if (currentHour > endHour || (currentHour === endHour && currentMinute > 0)) {
      break;
    }

    const bookedCount = Math.floor(Math.random() * (capacity + 1));
    const waitlistCount = bookedCount >= capacity ? Math.floor(Math.random() * 5) : 0;
    let status = 'available';
    if (bookedCount >= capacity) {
      status = waitlistCount > 0 ? 'waitlist' : 'full';
    }

    slots.push({
      id: `slot_${startStr.replace(':', '')}`,
      startTime: startStr,
      endTime: endStr,
      capacity,
      bookedCount,
      waitlistCount,
      status
    });
  }

  return slots;
};

export const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
