export type MessageType =
  | 'waitlist_notify'
  | 'waitlist_success'
  | 'waitlist_expired'
  | 'waitlist_skipped'
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_expired'
  | 'booking_checkedin'
  | 'quota_deduct'
  | 'quota_refund'
  | 'quota_recharge'
  | 'equipment_rented'
  | 'equipment_returned';

export const MESSAGE_TYPE_MAP: Record<MessageType, { title: string; icon: string; color: string }> = {
  waitlist_notify: { title: '候补补位通知', icon: '🔔', color: '#FF7D00' },
  waitlist_success: { title: '候补补位成功', icon: '✅', color: '#00B42A' },
  waitlist_expired: { title: '候补确认超时', icon: '⏰', color: '#F53F3F' },
  waitlist_skipped: { title: '候补名额顺延', icon: '➡️', color: '#86909C' },
  booking_created: { title: '预约成功', icon: '📅', color: '#165DFF' },
  booking_cancelled: { title: '预约已取消', icon: '❌', color: '#86909C' },
  booking_expired: { title: '预约已过期', icon: '⏰', color: '#F53F3F' },
  booking_checkedin: { title: '签到成功', icon: '✅', color: '#00B42A' },
  quota_deduct: { title: '额度扣减', icon: '📉', color: '#9B59B6' },
  quota_refund: { title: '额度退还', icon: '↩️', color: '#2EC4B6' },
  quota_recharge: { title: '额度充值', icon: '💳', color: '#FF6B35' },
  equipment_rented: { title: '装备租赁', icon: '🧗', color: '#165DFF' },
  equipment_returned: { title: '装备归还', icon: '🎒', color: '#00B42A' }
};

export interface AppMessage {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  icon: string;
  color: string;
  userId: string;
  teamId?: string;
  bookingId?: string;
  waitlistId?: string;
  quotaRecordId?: string;
  rentalId?: string;
  routeId?: string;
  date?: string;
  timeSlotId?: string;
  isRead: boolean;
  createdAt: string;
  actionType?: 'open_booking' | 'open_waitlist' | 'open_team' | 'open_equipment' | 'open_route';
  actionData?: Record<string, string>;
}
