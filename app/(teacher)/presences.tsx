import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { presenceService, Presence } from '../../services/presenceService';
import { useAuth } from '../../context/AuthContext';

export default function TeacherPresencesScreen() {
  const { user } = useAuth();
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'MASUK' | 'PULANG'>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await presenceService.getAll();
      setPresences(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getType = (p: Presence) => (p.exit ? 'PULANG' : 'MASUK');

  const filtered = presences.filter(p => {
    const type = getType(p);
    const matchFilter = filter === 'ALL' || type === filter;
    const name = `${p.student?.first_name ?? ''} ${p.student?.last_name ?? ''} ${p.student?.class ?? ''}`.toLowerCase();
    return matchFilter && name.includes(search.toLowerCase());
  });

  const todayCount = presences.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.enter).toDateString() === today;
  }).length;

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Data Absensi</Text>
          <Text style={styles.todayCount}>Hari ini: {todayCount} presensi</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Cari nama atau kelas..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['ALL', 'MASUK', 'PULANG'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'Semua' : f === 'MASUK' ? '✅ Masuk' : '🚪 Pulang'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.secondary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.presence_id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.secondary]} />
          }
          ListEmptyComponent={<Text style={styles.empty}>Belum ada data absensi.</Text>}
          renderItem={({ item }) => {
            const type = getType(item);
            return (
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: type === 'MASUK' ? '#DCFCE7' : '#FEF9C3' }]}>
                  <Text style={{ fontSize: 20 }}>{type === 'MASUK' ? '✅' : '🚪'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>
                    {item.student?.first_name} {item.student?.last_name}
                  </Text>
                  <Text style={styles.studentInfo}>
                    Kelas {item.student?.class} · NIS {item.student?.nis}
                  </Text>
                </View>
                <View style={styles.rightWrap}>
                  <View style={[styles.typePill, { backgroundColor: type === 'MASUK' ? COLORS.success : COLORS.warning }]}>
                    <Text style={styles.typePillText}>{type}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.enter)}</Text>
                  <Text style={styles.timeText}>{formatTime(item.enter)}</Text>
                </View>
              </View>
            );
          }}
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
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  todayCount: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  searchWrap: { padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 14,
    paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  studentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentInfo: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  rightWrap: { alignItems: 'flex-end', gap: 2 },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typePillText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  dateText: { fontSize: 11, color: COLORS.textMuted },
  timeText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
});
