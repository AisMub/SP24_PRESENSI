import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { presenceService, Presence } from '../../services/presenceService';

export default function PresencesScreen() {
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
    const name = `${p.student?.first_name ?? ''} ${p.student?.last_name ?? ''} ${p.student?.nis ?? ''}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Absensi</Text>
        <Text style={styles.subtitle}>{filtered.length} record</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Cari nama atau NIS..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
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
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.presence_id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada data absensi.</Text>}
          renderItem={({ item }) => {
            const type = getType(item);
            return (
              <View style={styles.card}>
                <View style={[styles.typeBadge, { backgroundColor: type === 'MASUK' ? '#DCFCE7' : '#FEF9C3' }]}>
                  <Text style={{ fontSize: 18 }}>{type === 'MASUK' ? '✅' : '🚪'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>
                    {item.student?.first_name} {item.student?.last_name}
                  </Text>
                  <Text style={styles.studentInfo}>
                    NIS: {item.student?.nis} · Kelas {item.student?.class}
                  </Text>
                  {item.teacher && (
                    <Text style={styles.teacherInfo}>
                      Guru: {item.teacher.first_name} {item.teacher.last_name}
                    </Text>
                  )}
                </View>
                <View style={styles.timeWrap}>
                  <Text style={styles.timeDate}>{formatDate(item.enter)}</Text>
                  <Text style={styles.timeHour}>{formatTime(item.enter)}</Text>
                  <View style={[styles.typePill, { backgroundColor: type === 'MASUK' ? COLORS.success : COLORS.warning }]}>
                    <Text style={styles.typePillText}>{type}</Text>
                  </View>
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
    backgroundColor: COLORS.primary, paddingHorizontal: 20,
    paddingTop: 54, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  searchWrap: { padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 14,
    paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, gap: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  typeBadge: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  studentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentInfo: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  teacherInfo: { fontSize: 11, color: COLORS.tertiary, marginTop: 2 },
  timeWrap: { alignItems: 'flex-end', gap: 2 },
  timeDate: { fontSize: 11, color: COLORS.textMuted },
  timeHour: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typePillText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
});
