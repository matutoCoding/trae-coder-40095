export interface Booking {
  id: string;
  routeId: string;
  routeName: string;
  userId: string;
  userName: string;
  teamId: string;
  date: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'checkedIn' | 'completed' | 'cancelled' | 'expired';
  statusText: string;
  createdAt: string;
  expiredAt: string;
  checkedInAt?: string;
  checkInCode?: string;
  equipmentRentals?: EquipmentRental[];
  isFromWaitlist?: boolean;
}

export interface WaitlistItem {
  id: string;
  routeId: string;
  routeName: string;
  userId: string;
  userName: string;
  teamId: string;
  date: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  position: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';
  createdAt: string;
  notifiedAt?: string;
}

export interface EquipmentRental {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  price: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checkedIn' | 'completed' | 'cancelled' | 'expired';
export type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';

export const BOOKING_STATUS_MAP: Record<BookingStatus, { text: string; color: string }> = {
  pending: { text: '待确认', color: '#FF7D00' },
  confirmed: { text: '已确认', color: '#165DFF' },
  checkedIn: { text: '已签到', color: '#00B42A' },
  completed: { text: '已完成', color: '#4E5969' },
  cancelled: { text: '已取消', color: '#86909C' },
  expired: { text: '已过期', color: '#F53F3F' }
};

export const WAITLIST_STATUS_MAP: Record<WaitlistStatus, { text: string; color: string }> = {
  waiting: { text: '排队中', color: '#165DFF' },
  notified: { text: '待确认', color: '#FF7D00' },
  confirmed: { text: '已确认', color: '#00B42A' },
  cancelled: { text: '已取消', color: '#86909C' },
  expired: { text: '已过期', color: '#F53F3F' }
};
