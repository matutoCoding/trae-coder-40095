import { create } from 'zustand';
import type { Route, RouteSchedule, TimeSlot } from '@/types/route';
import { mockRoutes, mockSchedules } from '@/data/routes';

interface RouteState {
  routes: Route[];
  schedules: Record<string, RouteSchedule>;
  selectedDate: string;
  selectedRoute: Route | null;
  loading: boolean;

  setSelectedDate: (date: string) => void;
  setSelectedRoute: (route: Route | null) => void;
  getRoutes: () => Route[];
  getRouteById: (id: string) => Route | undefined;
  getScheduleByDate: (date: string) => RouteSchedule[];
  getTimeSlots: (routeId: string, date: string) => TimeSlot[];
  updateTimeSlotBooking: (routeId: string, date: string, slotId: string, delta: number) => boolean;
  incrementWaitlist: (routeId: string, date: string, slotId: string) => void;
  decrementWaitlist: (routeId: string, date: string, slotId: string) => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: mockRoutes,
  schedules: mockSchedules,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedRoute: null,
  loading: false,

  setSelectedDate: (date) => set({ selectedDate: date }),

  setSelectedRoute: (route) => set({ selectedRoute: route }),

  getRoutes: () => get().routes,

  getRouteById: (id) => get().routes.find((r) => r.id === id),

  getScheduleByDate: (date) => {
    const { schedules, routes } = get();
    return routes.map((route) => {
      const key = `${route.id}_${date}`;
      return schedules[key] || {
        routeId: route.id,
        date,
        timeSlots: []
      };
    });
  },

  getTimeSlots: (routeId, date) => {
    const key = `${routeId}_${date}`;
    const schedule = get().schedules[key];
    return schedule?.timeSlots || [];
  },

  updateTimeSlotBooking: (routeId, date, slotId, delta) => {
    const key = `${routeId}_${date}`;
    const schedules = { ...get().schedules };
    const schedule = schedules[key];
    
    if (!schedule) return false;

    const slotIndex = schedule.timeSlots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) return false;

    const slot = { ...schedule.timeSlots[slotIndex] };
    const newBooked = slot.bookedCount + delta;

    if (newBooked < 0 || newBooked > slot.capacity) {
      return false;
    }

    slot.bookedCount = newBooked;
    
    if (newBooked >= slot.capacity) {
      slot.status = slot.waitlistCount > 0 ? 'waitlist' : 'full';
    } else {
      slot.status = 'available';
    }

    const newTimeSlots = [...schedule.timeSlots];
    newTimeSlots[slotIndex] = slot;
    schedules[key] = { ...schedule, timeSlots: newTimeSlots };

    set({ schedules });
    console.log(`[RouteStore] Updated slot ${slotId}: booked=${slot.bookedCount}, status=${slot.status}`);
    return true;
  },

  incrementWaitlist: (routeId, date, slotId) => {
    const key = `${routeId}_${date}`;
    const schedules = { ...get().schedules };
    const schedule = schedules[key];
    
    if (!schedule) return;

    const slotIndex = schedule.timeSlots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) return;

    const slot = { ...schedule.timeSlots[slotIndex] };
    slot.waitlistCount += 1;
    if (slot.bookedCount >= slot.capacity) {
      slot.status = 'waitlist';
    }

    const newTimeSlots = [...schedule.timeSlots];
    newTimeSlots[slotIndex] = slot;
    schedules[key] = { ...schedule, timeSlots: newTimeSlots };

    set({ schedules });
    console.log(`[RouteStore] Incremented waitlist for ${slotId}: count=${slot.waitlistCount}`);
  },

  decrementWaitlist: (routeId, date, slotId) => {
    const key = `${routeId}_${date}`;
    const schedules = { ...get().schedules };
    const schedule = schedules[key];
    
    if (!schedule) return;

    const slotIndex = schedule.timeSlots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) return;

    const slot = { ...schedule.timeSlots[slotIndex] };
    slot.waitlistCount = Math.max(0, slot.waitlistCount - 1);

    const newTimeSlots = [...schedule.timeSlots];
    newTimeSlots[slotIndex] = slot;
    schedules[key] = { ...schedule, timeSlots: newTimeSlots };

    set({ schedules });
    console.log(`[RouteStore] Decremented waitlist for ${slotId}: count=${slot.waitlistCount}`);
  }
}));
