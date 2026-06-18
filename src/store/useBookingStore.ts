import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Booking, WaitlistItem, EquipmentRental } from '@/types/booking';
import { mockBookings, mockWaitlistItems } from '@/data/bookings';
import { useRouteStore } from './useRouteStore';
import { useTeamStore } from './useTeamStore';
import { useEquipmentStore } from './useEquipmentStore';
import { useMessageStore } from './useMessageStore';
import { addMinutes, isTimeExpired } from '@/utils/time';

const AUTO_RELEASE_MINUTES = 15;
const WAITLIST_CONFIRM_MINUTES = 10;

interface BookingState {
  bookings: Booking[];
  waitlistItems: WaitlistItem[];
  currentUserId: string;
  currentUserName: string;
  autoReleaseTimers: Record<string, ReturnType<typeof setTimeout>>;
  waitlistTimers: Record<string, ReturnType<typeof setTimeout>>;
  tickInterval: ReturnType<typeof setInterval> | null;

  setCurrentUser: (userId: string, userName: string) => void;
  getMyBookings: () => Booking[];
  getMyWaitlistItems: () => WaitlistItem[];
  getBookingById: (id: string) => Booking | undefined;
  getBookingByCode: (code: string) => Booking | undefined;
  subscribe: (listener: () => void) => () => void;
  forceUpdate: () => void;

  createBooking: (params: {
    routeId: string;
    routeName: string;
    teamId: string;
    date: string;
    timeSlotId: string;
    startTime: string;
    endTime: string;
    equipmentRentals?: Array<{ equipmentId: string; equipmentName: string; quantity: number; price: number }>;
  }) => Promise<{ success: boolean; booking?: Booking; error?: string }>;

  cancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;

  checkInBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;

  startVenueSession: (bookingId: string) => Promise<{ success: boolean; error?: string }>;

  completeVenueSession: (bookingId: string) => Promise<{ success: boolean; error?: string; totalEquipmentFee?: number }>;

  joinWaitlist: (params: {
    routeId: string;
    routeName: string;
    teamId: string;
    date: string;
    timeSlotId: string;
    startTime: string;
    endTime: string;
  }) => Promise<{ success: boolean; waitlistItem?: WaitlistItem; error?: string }>;

  cancelWaitlist: (waitlistId: string) => Promise<{ success: boolean; error?: string }>;

  confirmWaitlist: (waitlistId: string) => Promise<{ success: boolean; booking?: Booking; error?: string }>;

  autoReleaseExpiredBookings: () => void;
  processNextWaitlist: (routeId: string, date: string, timeSlotId: string) => void;
  startAutoReleaseTimer: (bookingId: string) => void;
  stopAutoReleaseTimer: (bookingId: string) => void;
  startWaitlistTimer: (waitlistId: string) => void;
  stopWaitlistTimer: (waitlistId: string) => void;
  startTick: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: mockBookings,
  waitlistItems: mockWaitlistItems,
  currentUserId: 'user_001',
  currentUserName: '张三',
  autoReleaseTimers: {},
  waitlistTimers: {},
  tickInterval: null,

  setCurrentUser: (userId, userName) => set({ currentUserId: userId, currentUserName: userName }),

  getMyBookings: () => {
    const { bookings, currentUserId } = get();
    return bookings
      .filter((b) => b.userId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMyWaitlistItems: () => {
    const { waitlistItems, currentUserId } = get();
    return waitlistItems
      .filter((w) => w.userId === currentUserId && (w.status === 'waiting' || w.status === 'notified'))
      .sort((a, b) => a.position - b.position);
  },

  getBookingById: (id) => get().bookings.find((b) => b.id === id),

  getBookingByCode: (code) => {
    const upperCode = code.toUpperCase().trim();
    return get().bookings.find(
      (b) => b.checkInCode?.toUpperCase() === upperCode &&
        (b.status === 'confirmed' || b.status === 'checkedIn' || b.status === 'in_progress')
    );
  },

  subscribe: (listener) => {
    let lastState = JSON.stringify({
      bookings: get().bookings,
      waitlistItems: get().waitlistItems
    });
    const interval = setInterval(() => {
      const newState = JSON.stringify({
        bookings: get().bookings,
        waitlistItems: get().waitlistItems
      });
      if (newState !== lastState) {
        lastState = newState;
        listener();
      }
    }, 500);
    return () => clearInterval(interval);
  },

  forceUpdate: () => {
    set({ bookings: [...get().bookings] });
  },

  createBooking: async (params) => {
    const { currentUserId, currentUserName } = get();
    const { routeId, routeName, teamId, date, timeSlotId, startTime, endTime, equipmentRentals } = params;

    console.log('[BookingStore] Creating booking...', { routeId, teamId, timeSlotId });

    const routeStore = useRouteStore.getState();
    const teamStore = useTeamStore.getState();
    const equipmentStore = useEquipmentStore.getState();
    const messageStore = useMessageStore.getState();

    if (equipmentRentals && equipmentRentals.length > 0) {
      for (const er of equipmentRentals) {
        if (equipmentStore.getAvailableStock(er.equipmentId) < er.quantity) {
          return { success: false, error: `${er.equipmentName} 库存不足` };
        }
      }
    }

    if (!teamStore.checkSufficientQuota(teamId, 1)) {
      return { success: false, error: '团队额度不足' };
    }

    const deductResult = await teamStore.deductQuota(
      teamId,
      currentUserId,
      currentUserName,
      1,
      `预约${routeName} ${startTime}-${endTime}`,
    );

    if (!deductResult.success) {
      return { success: false, error: deductResult.error || '额度扣减失败' };
    }

    const slotUpdated = routeStore.updateTimeSlotBooking(routeId, date, timeSlotId, 1);
    if (!slotUpdated) {
      await teamStore.refundQuota(
        teamId,
        currentUserId,
        currentUserName,
        1,
        `预约失败退还${routeName}`,
      );
      return { success: false, error: '场次预约失败' };
    }

    const now = new Date().toISOString();
    const expiredAt = addMinutes(now, AUTO_RELEASE_MINUTES);
    const totalEquipmentFee = equipmentRentals?.reduce((sum, e) => sum + e.price * e.quantity, 0);

    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      routeId,
      routeName,
      userId: currentUserId,
      userName: currentUserName,
      teamId,
      date,
      timeSlotId,
      startTime,
      endTime,
      status: 'confirmed',
      statusText: '待签到',
      createdAt: now,
      expiredAt,
      checkInCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      totalEquipmentFee,
      equipmentRentals: equipmentRentals?.map((e) => ({
        equipmentId: e.equipmentId,
        equipmentName: e.equipmentName,
        quantity: e.quantity,
        price: e.price
      }))
    };

    let bookingRollback = false;

    if (equipmentRentals && equipmentRentals.length > 0) {
      for (const er of equipmentRentals) {
        const rentResult = await equipmentStore.rentEquipment({
          equipmentId: er.equipmentId,
          quantity: er.quantity,
          bookingId: newBooking.id,
          bookingRouteName: routeName,
          bookingDate: date,
          bookingTimeRange: `${startTime}-${endTime}`,
          userId: currentUserId,
          userName: currentUserName,
          teamId
        });
        if (!rentResult.success) {
          bookingRollback = true;
          break;
        }
      }
    }

    if (bookingRollback) {
      routeStore.updateTimeSlotBooking(routeId, date, timeSlotId, -1);
      await teamStore.refundQuota(
        teamId,
        currentUserId,
        currentUserName,
        1,
        `装备不足退还${routeName}`,
        newBooking.id
      );
      await equipmentStore.cancelRentalsByBookingId(newBooking.id);
      return { success: false, error: '装备租赁失败' };
    }

    set((state) => ({
      bookings: [newBooking, ...state.bookings]
    }));

    get().startAutoReleaseTimer(newBooking.id);

    messageStore.sendMessage({
      type: 'booking_created',
      content: `您已成功预约【${routeName}】${startTime}-${endTime}，凭签到码 ${newBooking.checkInCode} 到店签到。`,
      bookingId: newBooking.id,
      routeId,
      date,
      timeSlotId,
      actionType: 'open_booking',
      actionData: { bookingId: newBooking.id }
    });

    if (deductResult.newBalance !== undefined) {
      messageStore.sendMessage({
        type: 'quota_deduct',
        content: `团队扣减 1 次额度，预约【${routeName}】${startTime}，剩余额度 ${deductResult.newBalance} 次。`,
        teamId,
        actionType: 'open_team'
      });
    }

    console.log('[BookingStore] Booking created:', newBooking.id);
    return { success: true, booking: newBooking };
  },

  cancelBooking: async (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find((b) => b.id === bookingId);

    if (!booking) {
      return { success: false, error: '预约不存在' };
    }

    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'expired' || booking.status === 'in_progress') {
      return { success: false, error: '该预约无法取消' };
    }

    console.log('[BookingStore] Cancelling booking:', bookingId);

    const routeStore = useRouteStore.getState();
    const teamStore = useTeamStore.getState();
    const equipmentStore = useEquipmentStore.getState();
    const messageStore = useMessageStore.getState();

    routeStore.updateTimeSlotBooking(booking.routeId, booking.date, booking.timeSlotId, -1);

    const refundResult = await teamStore.refundQuota(
      booking.teamId,
      booking.userId,
      booking.userName,
      1,
      `取消预约${booking.routeName}`,
      booking.id
    );

    await equipmentStore.cancelRentalsByBookingId(bookingId);

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled', statusText: '已取消' } : b
      )
    }));

    get().stopAutoReleaseTimer(bookingId);

    messageStore.sendMessage({
      type: 'booking_cancelled',
      content: `您预约的【${booking.routeName}】${booking.date} ${booking.startTime} 已取消。`,
      bookingId,
      teamId: booking.teamId,
      actionType: 'open_booking',
      actionData: { bookingId }
    });

    if (refundResult.success && refundResult.newBalance !== undefined) {
      messageStore.sendMessage({
        type: 'quota_refund',
        content: `取消预约退还 1 次额度，团队剩余额度 ${refundResult.newBalance} 次。`,
        teamId: booking.teamId,
        actionType: 'open_team'
      });
    }

    get().processNextWaitlist(booking.routeId, booking.date, booking.timeSlotId);

    console.log('[BookingStore] Booking cancelled:', bookingId);
    return { success: true };
  },

  checkInBooking: async (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find((b) => b.id === bookingId);

    if (!booking) {
      return { success: false, error: '预约不存在' };
    }

    if (booking.status === 'expired') {
      return { success: false, error: '预约已过期，无法签到' };
    }

    if (booking.status === 'checkedIn' || booking.status === 'in_progress' || booking.status === 'completed') {
      return { success: false, error: '已签到，请勿重复操作' };
    }

    if (booking.status !== 'confirmed') {
      return { success: false, error: '该预约无法签到' };
    }

    const messageStore = useMessageStore.getState();

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'checkedIn', statusText: '已签到', checkedInAt: new Date().toISOString() } : b
      )
    }));

    get().stopAutoReleaseTimer(bookingId);

    messageStore.sendMessage({
      type: 'booking_checkedin',
      content: `【${booking.routeName}】${booking.startTime} 签到成功，请在核销台领取装备开始攀岩。`,
      bookingId,
      actionType: 'open_booking',
      actionData: { bookingId }
    });

    console.log('[BookingStore] Checked in:', bookingId);
    return { success: true };
  },

  startVenueSession: async (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find((b) => b.id === bookingId);

    if (!booking) {
      return { success: false, error: '预约不存在' };
    }

    if (booking.status !== 'checkedIn') {
      return { success: false, error: '请先完成签到' };
    }

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'in_progress', statusText: '进行中', startedAt: new Date().toISOString() } : b
      )
    }));

    console.log('[BookingStore] Session started:', bookingId);
    return { success: true };
  },

  completeVenueSession: async (bookingId) => {
    const { bookings } = get();
    const booking = bookings.find((b) => b.id === bookingId);

    if (!booking) {
      return { success: false, error: '预约不存在' };
    }

    if (booking.status !== 'checkedIn' && booking.status !== 'in_progress') {
      return { success: false, error: '当前状态无法完成会话' };
    }

    const equipmentStore = useEquipmentStore.getState();
    const relatedRentals = equipmentStore.getRentalsByBookingId(bookingId);

    let totalEquipmentFee = 0;
    for (const rental of relatedRentals) {
      if (rental.status === 'rented') {
        const result = await equipmentStore.returnEquipment(rental.id);
        if (result.success && rental.totalCost) {
          totalEquipmentFee += rental.totalCost;
        }
      }
    }

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'completed', statusText: '已完成', completedAt: new Date().toISOString(), totalEquipmentFee }
          : b
      )
    }));

    console.log('[BookingStore] Session completed:', bookingId, 'equipment fee:', totalEquipmentFee);
    return { success: true, totalEquipmentFee };
  },

  joinWaitlist: async (params) => {
    const { currentUserId, currentUserName, waitlistItems } = get();
    const { routeId, routeName, teamId, date, timeSlotId, startTime, endTime } = params;

    const existing = waitlistItems.find(
      (w) =>
        w.userId === currentUserId &&
        w.routeId === routeId &&
        w.timeSlotId === timeSlotId &&
        w.date === date &&
        (w.status === 'waiting' || w.status === 'notified')
    );

    if (existing) {
      return { success: false, error: '您已在候补队列中' };
    }

    const routeStore = useRouteStore.getState();
    const slot = routeStore.getTimeSlots(routeId, date).find((s) => s.id === timeSlotId);

    if (!slot) {
      return { success: false, error: '场次不存在' };
    }

    if (slot.bookedCount < slot.capacity) {
      return { success: false, error: '该场次仍有名额，请直接预约' };
    }

    const position = slot.waitlistCount + 1;

    const newWaitlistItem: WaitlistItem = {
      id: `waitlist_${Date.now()}`,
      routeId,
      routeName,
      userId: currentUserId,
      userName: currentUserName,
      teamId,
      date,
      timeSlotId,
      startTime,
      endTime,
      position,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      waitlistItems: [...state.waitlistItems, newWaitlistItem]
    }));

    routeStore.incrementWaitlist(routeId, date, timeSlotId);

    console.log('[BookingStore] Joined waitlist:', newWaitlistItem.id, 'position:', position);
    return { success: true, waitlistItem: newWaitlistItem };
  },

  cancelWaitlist: async (waitlistId) => {
    const { waitlistItems } = get();
    const item = waitlistItems.find((w) => w.id === waitlistId);

    if (!item) {
      return { success: false, error: '候补记录不存在' };
    }

    if (item.status !== 'waiting') {
      return { success: false, error: '无法取消该候补' };
    }

    const routeStore = useRouteStore.getState();
    routeStore.decrementWaitlist(item.routeId, item.date, item.timeSlotId);

    set((state) => ({
      waitlistItems: state.waitlistItems
        .filter((w) => w.id !== waitlistId)
        .map((w) =>
          w.routeId === item.routeId &&
          w.timeSlotId === item.timeSlotId &&
          w.date === item.date &&
          w.position > item.position
            ? { ...w, position: w.position - 1 }
            : w
        )
    }));

    get().stopWaitlistTimer(waitlistId);

    console.log('[BookingStore] Waitlist cancelled:', waitlistId);
    return { success: true };
  },

  confirmWaitlist: async (waitlistId) => {
    const { waitlistItems } = get();
    const item = waitlistItems.find((w) => w.id === waitlistId);

    if (!item) {
      return { success: false, error: '候补记录不存在' };
    }

    if (item.status !== 'notified') {
      return { success: false, error: '请等待补位通知' };
    }

    const teamStore = useTeamStore.getState();
    const routeStore = useRouteStore.getState();
    const messageStore = useMessageStore.getState();

    if (!teamStore.checkSufficientQuota(item.teamId, 1)) {
      set((state) => ({
        waitlistItems: state.waitlistItems.map((w) =>
          w.id === waitlistId ? { ...w, status: 'expired' } : w
        )
      }));
      routeStore.decrementWaitlist(item.routeId, item.date, item.timeSlotId);

      messageStore.sendMessage({
        type: 'waitlist_skipped',
        content: `候补【${item.routeName}】${item.startTime} 额度不足，名额自动让给下一位。`,
        userId: item.userId,
        teamId: item.teamId,
        waitlistId,
        routeId: item.routeId,
        actionType: 'open_waitlist'
      });

      get().processNextWaitlist(item.routeId, item.date, item.timeSlotId);
      return { success: false, error: '团队额度不足，名额自动让给下一位' };
    }

    const deductResult = await teamStore.deductQuota(
      item.teamId,
      item.userId,
      item.userName,
      1,
      `候补补位${item.routeName} ${item.startTime}-${item.endTime}`,
    );

    if (!deductResult.success) {
      set((state) => ({
        waitlistItems: state.waitlistItems.map((w) =>
          w.id === waitlistId ? { ...w, status: 'expired' } : w
        )
      }));
      routeStore.decrementWaitlist(item.routeId, item.date, item.timeSlotId);

      messageStore.sendMessage({
        type: 'waitlist_skipped',
        content: `候补【${item.routeName}】${item.startTime} 失败：${deductResult.error}，名额让给下一位。`,
        userId: item.userId,
        waitlistId
      });

      get().processNextWaitlist(item.routeId, item.date, item.timeSlotId);
      return { success: false, error: deductResult.error || '额度扣减失败' };
    }

    const slotUpdated = routeStore.updateTimeSlotBooking(item.routeId, item.date, item.timeSlotId, 1);
    if (!slotUpdated) {
      await teamStore.refundQuota(
        item.teamId,
        item.userId,
        item.userName,
        1,
        `候补失败退还${item.routeName}`,
      );
      return { success: false, error: '场次预约失败' };
    }

    routeStore.decrementWaitlist(item.routeId, item.date, item.timeSlotId);

    const now = new Date().toISOString();
    const expiredAt = addMinutes(now, AUTO_RELEASE_MINUTES);

    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      routeId: item.routeId,
      routeName: item.routeName,
      userId: item.userId,
      userName: item.userName,
      teamId: item.teamId,
      date: item.date,
      timeSlotId: item.timeSlotId,
      startTime: item.startTime,
      endTime: item.endTime,
      status: 'confirmed',
      statusText: '待签到',
      createdAt: now,
      expiredAt,
      checkInCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isFromWaitlist: true
    };

    set((state) => ({
      bookings: [newBooking, ...state.bookings],
      waitlistItems: state.waitlistItems
        .filter((w) => w.id !== waitlistId)
        .map((w) =>
          w.routeId === item.routeId &&
          w.timeSlotId === item.timeSlotId &&
          w.date === item.date &&
          w.position > item.position
            ? { ...w, position: w.position - 1 }
            : w
        )
    }));

    get().startAutoReleaseTimer(newBooking.id);
    get().stopWaitlistTimer(waitlistId);

    messageStore.sendMessage({
      type: 'waitlist_success',
      content: `候补补位成功！【${item.routeName}】${item.startTime} 预约已确认，签到码 ${newBooking.checkInCode}。`,
      userId: item.userId,
      teamId: item.teamId,
      bookingId: newBooking.id,
      routeId: item.routeId,
      actionType: 'open_booking',
      actionData: { bookingId: newBooking.id }
    });

    if (deductResult.newBalance !== undefined) {
      messageStore.sendMessage({
        type: 'quota_deduct',
        content: `候补扣减 1 次额度，剩余 ${deductResult.newBalance} 次。`,
        userId: item.userId,
        teamId: item.teamId,
        actionType: 'open_team'
      });
    }

    console.log('[BookingStore] Waitlist confirmed, booking created:', newBooking.id);
    return { success: true, booking: newBooking };
  },

  autoReleaseExpiredBookings: () => {
    const { bookings } = get();
    const now = new Date();

    bookings.forEach((booking) => {
      if (
        booking.status === 'confirmed' &&
        isTimeExpired(booking.expiredAt)
      ) {
        console.log('[BookingStore] Auto releasing expired booking:', booking.id);

        const routeStore = useRouteStore.getState();
        const teamStore = useTeamStore.getState();
        const equipmentStore = useEquipmentStore.getState();
        const messageStore = useMessageStore.getState();

        routeStore.updateTimeSlotBooking(booking.routeId, booking.date, booking.timeSlotId, -1);

        const refundResult = teamStore.refundQuota(
          booking.teamId,
          booking.userId,
          booking.userName,
          1,
          `超时未到退还${booking.routeName}`,
          booking.id
        );

        equipmentStore.cancelRentalsByBookingId(booking.id);

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === booking.id ? { ...b, status: 'expired', statusText: '已过期' } : b
          )
    }));

        messageStore.sendMessage({
          type: 'booking_expired',
          content: `【${booking.routeName}】${booking.startTime} 超时未到，预约已自动取消，额度已退还。`,
          bookingId: booking.id,
          userId: booking.userId,
          teamId: booking.teamId,
          actionType: 'open_booking',
          actionData: { bookingId: booking.id }
        });

        if (refundResult.success && refundResult.newBalance !== undefined) {
          messageStore.sendMessage({
            type: 'quota_refund',
            content: `超时释放退还 1 次额度，团队剩余 ${refundResult.newBalance} 次。`,
            userId: booking.userId,
            teamId: booking.teamId,
            actionType: 'open_team'
          });
        }

        get().processNextWaitlist(booking.routeId, booking.date, booking.timeSlotId);
      }
    });
  },

  processNextWaitlist: (routeId, date, timeSlotId) => {
    const { waitlistItems } = get();
    const messageStore = useMessageStore.getState();

    const nextInLine = waitlistItems
      .filter(
        (w) =>
          w.routeId === routeId &&
          w.timeSlotId === timeSlotId &&
          w.date === date &&
          w.status === 'waiting'
      )
      .sort((a, b) => a.position - b.position)[0];

    if (!nextInLine) {
      console.log('[BookingStore] No one in waitlist for slot:', timeSlotId);
      return;
    }

    console.log('[BookingStore] Notifying next in waitlist:', nextInLine.id, 'position:', nextInLine.position);

    const notifiedAt = new Date().toISOString();

    set((state) => ({
      waitlistItems: state.waitlistItems.map((w) =>
        w.id === nextInLine.id ? { ...w, status: 'notified', notifiedAt } : w
      )
    }));

    messageStore.sendMessage({
      type: 'waitlist_notify',
      content: `候补补位通知！【${nextInLine.routeName}】${nextInLine.startTime} 有名额空出，请在10分钟内确认！当前排位 #${nextInLine.position}`,
      waitlistId: nextInLine.id,
      userId: nextInLine.userId,
      teamId: nextInLine.teamId,
      routeId: nextInLine.routeId,
      actionType: 'open_waitlist',
      actionData: { waitlistId: nextInLine.id }
    });

    get().startWaitlistTimer(nextInLine.id);

    Taro.showToast({
      title: `补位通知：${nextInLine.routeName} ${nextInLine.startTime}`,
      icon: 'none',
      duration: 3000
    });
  },

  startAutoReleaseTimer: (bookingId) => {
    const stopTimers = get().stopAutoReleaseTimer;
    stopTimers(bookingId);

    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const now = new Date().getTime();
    const expireTime = new Date(booking.expiredAt).getTime();
    const delay = expireTime - now;

    if (delay <= 0) {
      get().autoReleaseExpiredBookings();
      return;
    }

    const timer = setTimeout(() => {
      console.log('[BookingStore] Auto-release timer triggered for booking:', bookingId);
      get().autoReleaseExpiredBookings();
    }, delay);

    set((state) => ({
      autoReleaseTimers: { ...state.autoReleaseTimers, [bookingId]: timer }
    }));
  },

  stopAutoReleaseTimer: (bookingId) => {
    const { autoReleaseTimers } = get();
    const timer = autoReleaseTimers[bookingId];
    if (timer) {
      clearTimeout(timer);
      const newTimers = { ...autoReleaseTimers };
      delete newTimers[bookingId];
      set({ autoReleaseTimers: newTimers });
    }
  },

  startWaitlistTimer: (waitlistId) => {
    get().stopWaitlistTimer(waitlistId);

    const item = get().waitlistItems.find((w) => w.id === waitlistId);
    if (!item || !item.notifiedAt) return;

    const delay = WAITLIST_CONFIRM_MINUTES * 60 * 1000;

    const timer = setTimeout(() => {
      console.log('[BookingStore] Waitlist timer expired for:', waitlistId);

      const messageStore = useMessageStore.getState();
      const currentItem = get().waitlistItems.find((w) => w.id === waitlistId);
      if (currentItem && currentItem.status === 'notified') {
        const routeStore = useRouteStore.getState();
        routeStore.decrementWaitlist(currentItem.routeId, currentItem.date, currentItem.timeSlotId);

        messageStore.sendMessage({
          type: 'waitlist_expired',
          content: `候补【${currentItem.routeName}】${currentItem.startTime} 未在10分钟内确认，名额已让给下一位。`,
          userId: currentItem.userId,
          teamId: currentItem.teamId,
          waitlistId,
          routeId: currentItem.routeId
        });

        set((state) => ({
          waitlistItems: state.waitlistItems
            .filter((w) => w.id !== waitlistId)
            .map((w) =>
              w.routeId === currentItem.routeId &&
              w.timeSlotId === currentItem.timeSlotId &&
              w.date === currentItem.date &&
              w.position > currentItem.position
                ? { ...w, position: w.position - 1 }
                : w
            )
        }));

        get().processNextWaitlist(currentItem.routeId, currentItem.date, currentItem.timeSlotId);
      }
    }, delay);

    set((state) => ({
      waitlistTimers: { ...state.waitlistTimers, [waitlistId]: timer }
    }));
  },

  stopWaitlistTimer: (waitlistId) => {
    const { waitlistTimers } = get();
    const timer = waitlistTimers[waitlistId];
    if (timer) {
      clearTimeout(timer);
      const newTimers = { ...waitlistTimers };
      delete newTimers[waitlistId];
      set({ waitlistTimers: newTimers });
    }
  },

  startTick: () => {
    if (get().tickInterval) return;

    const interval = setInterval(() => {
      get().autoReleaseExpiredBookings();
      set((state) => ({ bookings: [...state.bookings], waitlistItems: [...state.waitlistItems] }));
    }, 1000);

    set({ tickInterval: interval });
  }
}));
