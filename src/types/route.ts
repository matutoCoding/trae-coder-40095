export interface Route {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  levelText: string;
  height: number;
  angle: number;
  description: string;
  imageUrl: string;
  color: string;
  holdCount: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: 'available' | 'full' | 'waitlist' | 'closed';
}

export interface RouteSchedule {
  routeId: string;
  date: string;
  timeSlots: TimeSlot[];
}

export type RouteLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const ROUTE_LEVEL_MAP: Record<RouteLevel, { text: string; color: string }> = {
  beginner: { text: '初级', color: '#00B42A' },
  intermediate: { text: '中级', color: '#165DFF' },
  advanced: { text: '高级', color: '#FF7D00' },
  expert: { text: '专家', color: '#F53F3F' }
};
