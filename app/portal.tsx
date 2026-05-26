import React, { useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { presenceService, Presence } from '../services/presenceService';

interface ParentData {
  nis: string;
  first_name: string;
  last_name: string;
  class: string;
  parent: string;
  presences: { enter: string; exit: string | null }[];
}

export default function PortalScreen() {
  const router = useRouter();
  const [nis, setNis] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParentData | null>(null);
  const [error, setError] = useState('');

  const handleCek = async () => {
    if (!nis.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await presenceService.parentPortal(nis.trim());
      if (!data || !data.nis) {
        setError('Siswa dengan NIS tersebut tidak ditemukan.');
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message ?? 'Siswa tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const getStatus = (enter: string, exit: string | null) => {
    if (exit) return { label: 'Masuk & Pulang', color: COLORS.success, icon: '✅' };
    return { label: 'Masuk (Belum Pulang)', color: COLORS.warning, icon: '🕐' };
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portal Absensi Siswa</Text>
        <Text style={styles.headerSub}>Cek riwayat kehadiran tanpa login</Text>
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Nomor Induk Siswa (NIS)</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Masukkan NIS siswa..."
            placeholderTextColor={COLORS.textMuted}
            value={nis}
            onChangeText={setNis}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleCek}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleCek}
            disabled={loading || !nis.trim()}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.searchBtnText}>Cek</Text>
            }
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
      </View>

      {/* Result */}
      {result && (
        <FlatList
          data={result.presences}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.resultContent}
          ListHeaderComponent={() => (
            <View>
              {/* Student Info */}
              <View style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{result.first_name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{result.first_name} {result.last_name}</Text>
                  <Text style={styles.studentInfo}>NIS: {result.nis} · Kelas {result.class}</Text>
                  <Text style={styles.studentParent}>Wali: {result.parent}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{result.presences.length}</Text>
                  <Text style={styles.statLabel}>Total Presensi</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: COLORS.success }]}>
                    {result.presences.filter(p => p.exit).length}
                  </Text>
                  <Text style={styles.statLabel}>Pulang Tepat</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: COLORS.warning }]}>
                    {result.presences.filter(p => !p.exit).length}
                  </Text>
                  <Text style={styles.statLabel}>Belum Pulang</Text>
                </View>
              </View>

              <Text style={styles.historyTitle}>Riwayat 30 Hari Terakhir</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Belum ada riwayat absensi.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const status = getStatus(item.enter, item.exit);
            return (
              <View style={[styles.presenceItem, { borderLeftColor: status.color }]}>
                <View style={styles.presenceLeft}>
                  <Text style={styles.presenceIcon}>{status.icon}</Text>
                  <View>
                    <Text style={styles.presenceDate}>{formatDate(item.enter)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: status.color + '22' }]}>
                      <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.presenceRight}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Masuk</Text>
                    <Text style={styles.timeValue}>{formatTime(item.enter)}</Text>
                  </View>
                  {item.exit && (
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Pulang</Text>
                      <Text style={styles.timeValue}>{formatTime(item.exit)}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Empty state before search */}
      {!result && !loading && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>Masukkan NIS siswa untuk melihat riwayat absensi</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20,
    paddingTop: 54, paddingBottom: 20,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchCard: {
    backgroundColor: COLORS.white, margin: 16, borderRadius: 16, padding: 16,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  searchLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 16,
    color: COLORS.text, backgroundColor: COLORS.background,
  },
  searchBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 72,
  },
  searchBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  errorText: { color: COLORS.error, fontSize: 13, marginTop: 10, fontWeight: '500' },
  resultContent: { padding: 16, paddingTop: 0 },
  studentCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  studentAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
  studentName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  studentInfo: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  studentParent: { fontSize: 12, color: COLORS.tertiary, marginTop: 1 },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  statNum: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  presenceItem: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  presenceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  presenceIcon: { fontSize: 22 },
  presenceDate: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  presenceRight: { alignItems: 'flex-end', gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { fontSize: 10, color: COLORS.textMuted, width: 42, textAlign: 'right' },
  timeValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateIcon: { fontSize: 56, marginBottom: 16 },
  emptyStateText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
