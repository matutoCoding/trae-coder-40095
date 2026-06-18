import { create } from 'zustand';
import type { Team, TeamMember, QuotaRecord } from '@/types/team';
import { mockTeams, mockTeamMembers, mockQuotaRecords } from '@/data/teams';
import { quotaVersionManager, withLock } from '@/utils/lock';

interface TeamState {
  teams: Team[];
  currentTeamId: string;
  members: TeamMember[];
  quotaRecords: QuotaRecord[];
  loading: boolean;

  setCurrentTeam: (teamId: string) => void;
  getCurrentTeam: () => Team | undefined;
  getTeamById: (id: string) => Team | undefined;
  getMembers: (teamId: string) => TeamMember[];
  getQuotaRecords: (teamId: string) => QuotaRecord[];
  getRemainingQuota: (teamId: string) => number;
  
  deductQuota: (teamId: string, userId: string, userName: string, amount: number, description: string, bookingId?: string) => Promise<{ success: boolean; error?: string; newBalance?: number }>;
  refundQuota: (teamId: string, userId: string, userName: string, amount: number, description: string, bookingId?: string) => Promise<{ success: boolean; error?: string; newBalance?: number }>;
  
  checkSufficientQuota: (teamId: string, amount: number) => boolean;
  getQuotaVersion: (teamId: string) => number;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: mockTeams,
  currentTeamId: mockTeams[0]?.id || '',
  members: mockTeamMembers,
  quotaRecords: mockQuotaRecords,
  loading: false,

  setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),

  getCurrentTeam: () => {
    const { teams, currentTeamId } = get();
    return teams.find((t) => t.id === currentTeamId);
  },

  getTeamById: (id) => get().teams.find((t) => t.id === id),

  getMembers: (teamId) => get().members.filter((m) => m.status === 'active'),
  getQuotaRecords: (teamId) => {
    return get()
      .quotaRecords.filter((r) => r.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getRemainingQuota: (teamId) => {
    const team = get().getTeamById(teamId);
    return team ? team.totalQuota - team.usedQuota : 0;
  },

  checkSufficientQuota: (teamId, amount) => {
    const remaining = get().getRemainingQuota(teamId);
    return remaining >= amount;
  },

  getQuotaVersion: (teamId) => quotaVersionManager.getVersion(teamId),

  deductQuota: async (teamId, userId, userName, amount, description, bookingId) => {
    const lockKey = `quota_${teamId}`;
    const currentVersion = quotaVersionManager.getVersion(teamId);

    const result = await withLock(lockKey, currentVersion, async () => {
      const state = get();
      const team = state.teams.find((t) => t.id === teamId);

      if (!team) {
        throw new Error('团队不存在');
      }

      if (team.totalQuota - team.usedQuota < amount) {
        throw new Error('团队额度不足');
      }

      if (!quotaVersionManager.checkAndIncrement(teamId, currentVersion)) {
        throw new Error('操作冲突，请重试');
      }

      const newUsedQuota = team.usedQuota + amount;
      const newBalance = team.totalQuota - newUsedQuota;

      const updatedTeams = state.teams.map((t) =>
        t.id === teamId ? { ...t, usedQuota: newUsedQuota } : t
      );

      const memberIndex = state.members.findIndex((m) => m.userId === userId);
      let updatedMembers = state.members;
      if (memberIndex !== -1) {
        updatedMembers = state.members.map((m) =>
          m.userId === userId ? { ...m, usedQuota: m.usedQuota + amount } : m
        );
      }

      const newRecord: QuotaRecord = {
        id: `record_${Date.now()}`,
        teamId,
        userId,
        userName,
        type: 'deduct',
        typeText: '扣减',
        amount,
        balanceAfter: newBalance,
        description,
        relatedBookingId: bookingId,
        createdAt: new Date().toISOString()
      };

      set({
        teams: updatedTeams,
        members: updatedMembers,
        quotaRecords: [newRecord, ...state.quotaRecords]
      });

      console.log(`[TeamStore] Deducted ${amount} quota from team ${teamId}, new balance: ${newBalance}`);
      return newBalance;
    });

    if (result.success && result.data !== undefined) {
      return { success: true, newBalance: result.data };
    } else {
      return { success: false, error: result.error };
    }
  },

  refundQuota: async (teamId, userId, userName, amount, description, bookingId) => {
    const lockKey = `quota_${teamId}`;
    const currentVersion = quotaVersionManager.getVersion(teamId);

    const result = await withLock(lockKey, currentVersion, async () => {
      const state = get();
      const team = state.teams.find((t) => t.id === teamId);

      if (!team) {
        throw new Error('团队不存在');
      }

      if (!quotaVersionManager.checkAndIncrement(teamId, currentVersion)) {
        throw new Error('操作冲突，请重试');
      }

      const newUsedQuota = Math.max(0, team.usedQuota - amount);
      const newBalance = team.totalQuota - newUsedQuota;

      const updatedTeams = state.teams.map((t) =>
        t.id === teamId ? { ...t, usedQuota: newUsedQuota } : t
      );

      const memberIndex = state.members.findIndex((m) => m.userId === userId);
      let updatedMembers = state.members;
      if (memberIndex !== -1) {
        updatedMembers = state.members.map((m) =>
          m.userId === userId ? { ...m, usedQuota: Math.max(0, m.usedQuota - amount) } : m
        );
      }

      const newRecord: QuotaRecord = {
        id: `record_${Date.now()}`,
        teamId,
        userId,
        userName,
        type: 'refund',
        typeText: '退还',
        amount,
        balanceAfter: newBalance,
        description,
        relatedBookingId: bookingId,
        createdAt: new Date().toISOString()
      };

      set({
        teams: updatedTeams,
        members: updatedMembers,
        quotaRecords: [newRecord, ...state.quotaRecords]
      });

      console.log(`[TeamStore] Refunded ${amount} quota to team ${teamId}, new balance: ${newBalance}`);
      return newBalance;
    });

    if (result.success && result.data !== undefined) {
      return { success: true, newBalance: result.data };
    } else {
      return { success: false, error: result.error };
    }
  }
}));
