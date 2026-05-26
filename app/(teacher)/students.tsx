import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { studentService, Student } from '../../services/studentService';

export default function TeacherStudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.nis} ${s.class}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daftar Siswa</Text>
        <Text style={styles.count}>{filtered.length} siswa</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Cari nama, NIS, atau kelas..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.secondary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.secondary]} />}
          ListEmptyComponent={<Text style={styles.empty}>Tidak ada siswa ditemukan.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.first_name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.info}>NIS: {item.nis} · Kelas {item.class}</Text>
                <Text style={styles.parent}>Wali: {item.parent}</Text>
              </View>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{item.class}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 20,
    paddingTop: 54, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  searchWrap: { padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  info: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  parent: { fontSize: 11, color: COLORS.tertiary, marginTop: 1 },
  classBadge: {
    backgroundColor: COLORS.overlay, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
  },
  classBadgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
});
