import { View, Text, FlatList } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import GroupMemberRow from './GroupMemberRow';

export default function GroupMembersSheet({
  visible,
  onClose,
  members,
}: any) {
  const mutuals = members.filter((m: any) => m.isMutual);
  const others = members.filter((m: any) => !m.isMutual);

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoint={0.75}>
      {mutuals.length > 0 && (
        <>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>
            People you know
          </Text>
          <FlatList
            data={mutuals}
            renderItem={({ item }) => <GroupMemberRow member={item} />}
          />
        </>
      )}

      <Text style={{ fontWeight: '700', fontSize: 18, marginTop: 16 }}>
        All members
      </Text>

      <FlatList
        data={others.length > 0 ? others : members}
        renderItem={({ item }) => <GroupMemberRow member={item} />}
      />
    </BottomSheet>
  );
}