import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { teacherService } from '../../services/teacherService';
import { studentService } from '../../services/studentService';
import { presenceService } from '../../services/presenceService';

interface StatCard { label: string; value: number; icon: string; color: string; route: string }

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ teachers: 0, students: 0, presences: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [teachers, students, presences] = await Promise.all([
          teacherService.getAll(),
          studentService.getAll(),
          presenceService.getAll(),
        ]);
        setStats({
          teachers: Array.isArray(teachers) ? teachers.length : 0,
          students: Array.isArray(students) ? students.length : 0,
          presences: Array.isArray(presences) ? presences.length : 0,
        });
      } catch {
        // keep zeros
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards: StatCard[] = [
    { label: 'Total Guru', value: stats.teachers, icon: '👩‍🏫', color: COLORS.primary, route: '/(admin)/teachers' },
    { label: 'Total Siswa', value: stats.students, icon: '🎒', color: COLORS.secondary, route: '/(admin)/students' },
    { label: 'Total Presensi', value: stats.presences, icon: '✅', color: COLORS.tertiary, route: '/(admin)/presences' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Selamat datang,</Text>
          <Text style={styles.name}>{user?.username ?? 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Badge Admin */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>👑 Administrator</Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Ringkasan Data</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.statsGrid}>
          {cards.map(c => (
            <TouchableOpacity
              key={c.label}
              style={[styles.statCard, { borderLeftColor: c.color }]}
              onPress={() => router.push(c.route as any)}
            >
              <Text style={styles.statIcon}>{c.icon}</Text>
              <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Menu Cepat</Text>
      <View style={styles.actionsGrid}>
        {[
          { label: 'Tambah Guru', icon: '➕', route: '/(admin)/teachers' },
          { label: 'Tambah Siswa', icon: '➕', route: '/(admin)/students' },
          { label: 'Lihat Absensi', icon: '📋', route: '/(admin)/presences' },
        ].map(a => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionCard}
            onPress={() => router.push(a.route as any)}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 54 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: { fontSize: 14, color: COLORS.textMuted },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.overlay,
  },
  logoutText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  badgeRow: { marginBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    alignItems: 'center',
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  actionIcon: { fontSize: 26, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
