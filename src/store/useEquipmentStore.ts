import { create } from 'zustand';
import type { Equipment, RentalRecord } from '@/types/equipment';
import { mockEquipments, mockRentalRecords } from '@/data/equipments';

interface EquipmentState {
  equipments: Equipment[];
  rentalRecords: RentalRecord[];
  currentUserId: string;
  currentUserName: string;
  selectedCategory: string;

  setSelectedCategory: (category: string) => void;
  setCurrentUser: (userId: string, userName: string) => void;
  getEquipmentsByCategory: (category?: string) => Equipment[];
  getEquipmentById: (id: string) => Equipment | undefined;
  getMyRentals: () => RentalRecord[];
  getRentalsByBookingId: (bookingId: string) => RentalRecord[];
  getAvailableStock: (equipmentId: string) => number;

  rentEquipment: (params: {
    equipmentId: string;
    quantity: number;
    bookingId?: string;
    bookingRouteName?: string;
    bookingDate?: string;
    bookingTimeRange?: string;
    userId?: string;
    userName?: string;
    teamId?: string;
  }) => Promise<{ success: boolean; rental?: RentalRecord; error?: string }>;

  returnEquipment: (rentalId: string) => Promise<{ success: boolean; error?: string }>;

  cancelRentalsByBookingId: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipments: mockEquipments,
  rentalRecords: mockRentalRecords,
  currentUserId: 'user_001',
  currentUserName: '张三',
  selectedCategory: 'all',

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setCurrentUser: (userId, userName) => set({ currentUserId: userId, currentUserName: userName }),

  getEquipmentsByCategory: (category) => {
    const { equipments } = get();
    if (!category || category === 'all') return equipments;
    return equipments.filter((e) => e.category === category);
  },

  getEquipmentById: (id) => get().equipments.find((e) => e.id === id),

  getMyRentals: () => {
    const { rentalRecords, currentUserId } = get();
    return rentalRecords
      .filter((r) => r.userId === currentUserId)
      .sort((a, b) => new Date(b.rentTime).getTime() - new Date(a.rentTime).getTime());
  },

  getRentalsByBookingId: (bookingId) => {
    return get().rentalRecords.filter((r) => r.bookingId === bookingId);
  },

  getAvailableStock: (equipmentId) => {
    const equipment = get().equipments.find((e) => e.id === equipmentId);
    return equipment?.availableStock || 0;
  },

  rentEquipment: async ({ equipmentId, quantity, bookingId, bookingRouteName, bookingDate, bookingTimeRange, userId, userName, teamId }) => {
    const { equipments, currentUserId, currentUserName } = get();
    const equipment = equipments.find((e) => e.id === equipmentId);

    if (!equipment) {
      return { success: false, error: '装备不存在' };
    }

    if (equipment.availableStock < quantity) {
      return { success: false, error: '库存不足' };
    }

    const now = new Date();
    const expectedReturn = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newRental: RentalRecord = {
      id: `rental_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      equipmentId,
      equipmentName: equipment.name,
      userId: userId || currentUserId,
      userName: userName || currentUserName,
      teamId: teamId || 'team_001',
      bookingId,
      bookingRouteName,
      bookingDate,
      bookingTimeRange,
      quantity,
      price: equipment.price,
      deposit: equipment.deposit * quantity,
      status: 'rented',
      statusText: '租赁中',
      rentTime: now.toISOString(),
      expectedReturnTime: expectedReturn.toISOString()
    };

    set((state) => ({
      equipments: state.equipments.map((e) =>
        e.id === equipmentId
          ? { ...e, availableStock: e.availableStock - quantity }
          : e
      ),
      rentalRecords: [newRental, ...state.rentalRecords]
    }));

    console.log('[EquipmentStore] Rented equipment:', equipment.name, 'x', quantity, 'booking:', bookingId);
    return { success: true, rental: newRental };
  },

  returnEquipment: async (rentalId) => {
    const { rentalRecords } = get();
    const rental = rentalRecords.find((r) => r.id === rentalId);

    if (!rental) {
      return { success: false, error: '租赁记录不存在' };
    }

    if (rental.status !== 'rented' && rental.status !== 'overdue') {
      return { success: false, error: '该记录无法归还' };
    }

    const now = new Date();
    const rentHours = (now.getTime() - new Date(rental.rentTime).getTime()) / (1000 * 60 * 60);
    const totalCost = Math.ceil(rentHours) * rental.price * rental.quantity;

    set((state) => ({
      equipments: state.equipments.map((e) =>
        e.id === rental.equipmentId
          ? { ...e, availableStock: e.availableStock + rental.quantity }
          : e
      ),
      rentalRecords: state.rentalRecords.map((r) =>
        r.id === rentalId
          ? {
              ...r,
              status: 'returned',
              statusText: '到店归还',
              returnSource: 'checkin_return' as const,
              returnTime: now.toISOString(),
              totalCost
            }
          : r
      )
    }));

    console.log('[EquipmentStore] Returned equipment:', rental.equipmentName, 'cost:', totalCost);
    return { success: true };
  },

  cancelRentalsByBookingId: async (bookingId) => {
    const { rentalRecords } = get();
    const relatedRentals = rentalRecords.filter(
      (r) => r.bookingId === bookingId && r.status === 'rented'
    );

    if (relatedRentals.length === 0) {
      return { success: true };
    }

    const now = new Date();
    const equipmentsToRestore: Record<string, number> = {};

    relatedRentals.forEach((rental) => {
      equipmentsToRestore[rental.equipmentId] =
        (equipmentsToRestore[rental.equipmentId] || 0) + rental.quantity;
    });

    set((state) => {
      const updatedEquipments = state.equipments.map((e) => {
        const restoreQty = equipmentsToRestore[e.id] || 0;
        if (restoreQty > 0) {
          return { ...e, availableStock: e.availableStock + restoreQty };
        }
        return e;
      });

      const updatedRecords = state.rentalRecords.map((r) => {
        if (r.bookingId === bookingId && r.status === 'rented') {
          return {
            ...r,
            status: 'cancelled' as const,
            statusText: '取消释放',
            returnSource: 'booking_cancel' as const,
            returnTime: now.toISOString(),
            totalCost: 0
          };
        }
        return r;
      });

      return { equipments: updatedEquipments, rentalRecords: updatedRecords };
    });

    console.log('[EquipmentStore] Cancelled rentals for booking:', bookingId, 'count:', relatedRentals.length);
    return { success: true };
  }
}));
