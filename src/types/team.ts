export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  totalQuota: number;
  usedQuota: number;
  memberCount: number;
  createdAt: string;
  expireDate: string;
  avatarColor: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  avatarColor: string;
  role: 'owner' | 'admin' | 'member';
  roleText: string;
  usedQuota: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface QuotaRecord {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  type: 'deduct' | 'refund' | 'recharge' | 'adjust';
  typeText: string;
  amount: number;
  balanceAfter: number;
  description: string;
  relatedBookingId?: string;
  createdAt: string;
}

export type MemberRole = 'owner' | 'admin' | 'member';
export type QuotaType = 'deduct' | 'refund' | 'recharge' | 'adjust';

export const MEMBER_ROLE_MAP: Record<MemberRole, { text: string; color: string }> = {
  owner: { text: '队长', color: '#FF6B35' },
  admin: { text: '管理员', color: '#165DFF' },
  member: { text: '成员', color: '#4E5969' }
};

export const QUOTA_TYPE_MAP: Record<QuotaType, { text: string; color: string }> = {
  deduct: { text: '扣减', color: '#F53F3F' },
  refund: { text: '退还', color: '#00B42A' },
  recharge: { text: '充值', color: '#FF6B35' },
  adjust: { text: '调整', color: '#165DFF' }
};
