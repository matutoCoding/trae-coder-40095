import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import type { TeamMember } from '@/types/team';
import { MEMBER_ROLE_MAP } from '@/types/team';

interface TeamMemberItemProps {
  member: TeamMember;
  showUsedQuota?: boolean;
}

const TeamMemberItem: React.FC<TeamMemberItemProps> = ({ member, showUsedQuota = true }) => {
  const roleInfo = MEMBER_ROLE_MAP[member.role];
  const initial = member.userName.charAt(0);

  return (
    <View className={styles.memberItem}>
      <View className={styles.avatar} style={{ backgroundColor: member.avatarColor }}>
        <Text className={styles.avatarText}>{initial}</Text>
      </View>
      <View className={styles.info}>
        <View className={styles.nameRow}>
          <Text className={styles.userName}>{member.userName}</Text>
          <View
            className={styles.roleTag}
            style={{ color: roleInfo.color, backgroundColor: `${roleInfo.color}15` }}
          >
            <Text className={styles.roleText}>{roleInfo.text}</Text>
          </View>
        </View>
        {showUsedQuota && (
          <Text className={styles.usedQuota}>已使用 {member.usedQuota} 次</Text>
        )}
      </View>
    </View>
  );
};

export default TeamMemberItem;
