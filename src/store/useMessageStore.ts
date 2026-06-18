import { create } from 'zustand';
import type { AppMessage, MessageType } from '@/types/message';
import { MESSAGE_TYPE_MAP } from '@/types/message';

interface MessageState {
  messages: AppMessage[];
  currentUserId: string;
  currentTeamId: string;

  setCurrentUser: (userId: string, teamId: string) => void;
  getUnreadCount: () => number;
  getMyMessages: () => AppMessage[];
  markAsRead: (messageId: string) => void;
  markAllAsRead: () => void;
  getMessageById: (id: string) => AppMessage | undefined;

  sendMessage: (params: {
    type: MessageType;
    content: string;
    userId?: string;
    teamId?: string;
    bookingId?: string;
    waitlistId?: string;
    quotaRecordId?: string;
    rentalId?: string;
    routeId?: string;
    date?: string;
    timeSlotId?: string;
    actionType?: AppMessage['actionType'];
    actionData?: Record<string, string>;
  }) => AppMessage;
}

const mockMessages: AppMessage[] = [
  {
    id: 'msg_001',
    type: 'waitlist_notify',
    title: '候补补位通知',
    content: '您候补的【高手挑战墙】16:00 场次有名额空出，请在10分钟内确认！',
    icon: '🔔',
    color: '#FF7D00',
    userId: 'user_001',
    teamId: 'team_001',
    waitlistId: 'waitlist_001',
    routeId: 'route_003',
    date: new Date().toISOString().split('T')[0],
    timeSlotId: 'ts_1600',
    isRead: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    actionType: 'open_waitlist',
    actionData: { waitlistId: 'waitlist_001' }
  },
  {
    id: 'msg_002',
    type: 'booking_created',
    title: '预约成功',
    content: '您已成功预约【初级体验墙】10:00-12:00，凭签到码 ABC123 到店签到。',
    icon: '📅',
    color: '#165DFF',
    userId: 'user_001',
    teamId: 'team_001',
    bookingId: 'booking_001',
    routeId: 'route_001',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionType: 'open_booking',
    actionData: { bookingId: 'booking_001' }
  },
  {
    id: 'msg_003',
    type: 'quota_deduct',
    title: '额度扣减',
    content: '团队【攀岩先锋】扣减 1 次额度，用于预约【进阶训练墙】14:00，剩余额度 48 次。',
    icon: '📉',
    color: '#9B59B6',
    userId: 'user_001',
    teamId: 'team_001',
    quotaRecordId: 'record_002',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    actionType: 'open_team'
  }
];

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: mockMessages,
  currentUserId: 'user_001',
  currentTeamId: 'team_001',

  setCurrentUser: (userId, teamId) => set({ currentUserId: userId, currentTeamId: teamId }),

  getUnreadCount: () => {
    const { messages, currentUserId } = get();
    return messages.filter((m) => m.userId === currentUserId && !m.isRead).length;
  },

  getMyMessages: () => {
    const { messages, currentUserId } = get();
    return messages
      .filter((m) => m.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
    }));
  },

  markAllAsRead: () => {
    const { currentUserId } = get();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.userId === currentUserId ? { ...m, isRead: true } : m
      )
    }));
  },

  getMessageById: (id) => get().messages.find((m) => m.id === id),

  sendMessage: (params) => {
    const { currentUserId, currentTeamId } = get();
    const { type, content } = params;
    const typeInfo = MESSAGE_TYPE_MAP[type];

    const newMessage: AppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: params.title || typeInfo.title,
      content,
      icon: typeInfo.icon,
      color: typeInfo.color,
      userId: params.userId || currentUserId,
      teamId: params.teamId || currentTeamId,
      bookingId: params.bookingId,
      waitlistId: params.waitlistId,
      quotaRecordId: params.quotaRecordId,
      rentalId: params.rentalId,
      routeId: params.routeId,
      date: params.date,
      timeSlotId: params.timeSlotId,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionType: params.actionType,
      actionData: params.actionData
    };

    set((state) => ({
      messages: [newMessage, ...state.messages]
    }));

    console.log('[MessageStore] Sent message:', type, '-', content.substring(0, 30));
    return newMessage;
  }
}));
