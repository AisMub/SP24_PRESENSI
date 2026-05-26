import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Clipboard,
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { SOCKET_URL } from '../../constants/api';
import { presenceService } from '../../services/presenceService';

interface ScanResult {
  id: string;
  tagId: string;
  studentName: string;
  type: 'MASUK' | 'PULANG';
  time: string;
  success: boolean;
  message?: string;
}

type NfcStatus = 'checking' | 'unsupported' | 'disabled' | 'ready';
type WsStatus  = 'connecting' | 'connected' | 'disconnected';

export default function NFCScannerScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [nfcStatus, setNfcStatus]   = useState<NfcStatus>('checking');
  const [wsStatus, setWsStatus]     = useState<WsStatus>('connecting');
  const [scanLoading, setScanLoading] = useState(false);
  const [lastTag, setLastTag]       = useState('');
  const [results, setResults]       = useState<ScanResult[]>([]);

  // Refs — no stale closures
  const userRef        = useRef(user);
  const scanLoadingRef = useRef(false);
  const lastEmitRef    = useRef(0);
  const socketRef      = useRef<Socket | null>(null);
  const pairingCodeRef = useRef('');
  const pulseAnim      = useRef(new Animated.Value(1)).current;

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { scanLoadingRef.current = scanLoading; }, [scanLoading]);

  // Pulse while processing
  useEffect(() => {
    if (!scanLoading) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLoading]);

  // ── NFC handler ──────────────────────────────────────────────────────
  const onTagDiscovered = useCallback(async (tag: any) => {
    const now = Date.now();
    if (now - lastEmitRef.current < 2000) return;
    if (scanLoadingRef.current) return;
    lastEmitRef.current = now;

    const rawId: string = tag.id ?? '';
    if (!rawId) return;

    setLastTag(rawId);

    // Kirim ke web dashboard via WebSocket (jika sudah punya kode)
    const code = pairingCodeRef.current;
    if (code && socketRef.current?.connected) {
      socketRef.current.emit('android-send-tag', { pairingCode: code, tagId: rawId });
    }

    // Catat absensi via REST API
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    setScanLoading(true);
    try {
      const res = await presenceService.tap(rawId, currentUser.id);
      if (!res.success) throw new Error(res.message ?? 'Gagal mencatat absensi');

      const action  = res.data?.action ?? '';
      const student = res.data?.student;
      setResults(prev => [{
        id: String(Date.now()),
        tagId: rawId,
        studentName: student ? `${student.first_name} ${student.last_name}` : rawId,
        type: action === 'EXIT' ? 'PULANG' : 'MASUK',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        success: true,
        message: res.message,
      }, ...prev.slice(0, 29)]);
    } catch (e: any) {
      setResults(prev => [{
        id: String(Date.now()),
        tagId: rawId,
        studentName: e.message ?? 'Kartu tidak dikenali',
        type: 'MASUK',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        success: false,
        message: e.message,
      }, ...prev.slice(0, 29)]);
    } finally {
      setScanLoading(false);
    }
  }, []);

  // ── Socket + NFC init (auto, no button needed) ───────────────────────
  useEffect(() => {
    // Auto-connect ke wss://sp24api.wind.my.id saat halaman dibuka
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setWsStatus('connected');
      // Otomatis minta kode room agar bisa forward tag ke web dashboard
      socket.emit('request-pairing-code');
    });

    socket.on('disconnect', () => {
      setWsStatus('disconnected');
      pairingCodeRef.current = '';
    });

    socket.on('connect_error', () => setWsStatus('disconnected'));

    // Simpan kode yang diberikan server (dipakai saat kirim android-send-tag)
    socket.on('pairing-code-generated', (code: string) => {
      pairingCodeRef.current = code;
    });

    // NFC init
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (!supported) { setNfcStatus('unsupported'); return; }
        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();
        if (!enabled) { setNfcStatus('disabled'); return; }
        setNfcStatus('ready');
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.DiscoverTag, onTagDiscovered);
        await NfcManager.registerTagEvent();
      } catch {
        setNfcStatus('disabled');
      }
    };
    initNfc();

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => null);
      socket.disconnect();
    };
  }, [onTagDiscovered]);

  const handleLogout = async () => { await logout(); router.replace('/login'); };

  const copyTagId = () => {
    if (!lastTag) return;
    Clipboard.setString(lastTag);
    Alert.alert('Disalin', `Tag ID "${lastTag}" disalin ke clipboard.`);
  };

  // Derived UI
  const nfcInfo = {
    checking:   { icon: '⏳', text: 'Memeriksa NFC...', color: COLORS.textMuted },
    unsupported:{ icon: '❌', text: 'HP tidak mendukung NFC', color: COLORS.error },
    disabled:   { icon: '⚠️', text: 'Aktifkan NFC di Pengaturan HP', color: COLORS.warning },
    ready:      { icon: '📡', text: 'Tempelkan kartu siswa', color: COLORS.primary },
  }[nfcStatus];

  const wsColor = { connecting: '#facc15', connected: COLORS.success, disconnected: COLORS.error }[wsStatus];
  const wsLabel = { connecting: 'Menghubungkan ke server...', connected: 'Server terhubung', disconnected: 'Server terputus' }[wsStatus];

  const lastResult = results[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 {user?.first_name ?? user?.username}</Text>
          <View style={styles.wsRow}>
            {wsStatus === 'connecting'
              ? <ActivityIndicator size="small" color="#facc15" style={{ marginRight: 6, transform: [{ scale: 0.7 }] }} />
              : <View style={[styles.wsDot, { backgroundColor: wsColor }]} />
            }
            <Text style={[styles.wsLabel, { color: wsColor }]}>{wsLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Scanner Card */}
      <View style={styles.scannerCard}>
        <Text style={styles.scannerTitle}>Scanner Absensi NFC</Text>

        <Animated.View style={[
          styles.nfcCircle,
          scanLoading && { transform: [{ scale: pulseAnim }] },
          nfcStatus === 'disabled'    && { backgroundColor: COLORS.warning },
          nfcStatus === 'unsupported' && { backgroundColor: COLORS.error },
        ]}>
          {scanLoading
            ? <ActivityIndicator color={COLORS.white} size="large" />
            : <Text style={styles.nfcIcon}>{nfcInfo.icon}</Text>
          }
        </Animated.View>

        <Text style={[styles.scanStatus, { color: nfcInfo.color }]}>
          {scanLoading ? 'Memproses...' : nfcInfo.text}
        </Text>

        {/* Last tag ID */}
        {lastTag ? (
          <TouchableOpacity style={styles.tagRow} onPress={copyTagId}>
            <Text style={styles.tagLabel}>Tag ID: </Text>
            <Text style={styles.tagValue}>{lastTag}</Text>
            <Text style={styles.tagCopy}>  📋 Salin</Text>
          </TouchableOpacity>
        ) : null}

        {/* Last result bubble */}
        {lastResult && (
          <View style={[styles.resultBadge, { backgroundColor: lastResult.success ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={styles.resultIcon}>
              {lastResult.success ? (lastResult.type === 'MASUK' ? '✅' : '🚪') : '❌'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultName, { color: lastResult.success ? '#166534' : COLORS.error }]}>
                {lastResult.studentName}
              </Text>
              <Text style={styles.resultSub}>
                {lastResult.success ? lastResult.type : 'Gagal'} · {lastResult.time}
              </Text>
              {lastResult.message && lastResult.success && (
                <Text style={styles.resultMsg}>{lastResult.message}</Text>
              )}
            </View>
          </View>
        )}

        {nfcStatus === 'disabled' && (
          <View style={styles.disabledNote}>
            <Text style={styles.disabledText}>Aktifkan NFC di Pengaturan → Koneksi</Text>
          </View>
        )}
      </View>

      {/* History */}
      {results.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Riwayat Scan ({results.length})</Text>
          {results.map(r => (
            <View key={r.id} style={[styles.historyItem, { borderLeftColor: r.success ? COLORS.success : COLORS.error }]}>
              <Text style={styles.historyIcon}>
                {r.success ? (r.type === 'MASUK' ? '✅' : '🚪') : '❌'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>{r.studentName}</Text>
                <Text style={styles.historyTag}>{r.tagId} · {r.time}</Text>
              </View>
              <Text style={[styles.historyType, { color: r.success ? COLORS.success : COLORS.error }]}>
                {r.success ? r.type : 'ERROR'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 20, paddingTop: 54, paddingBottom: 40, gap: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  wsRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wsDot:  { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  wsLabel:{ fontSize: 12, fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.overlay },
  logoutText:{ color: COLORS.primary, fontWeight: '600', fontSize: 13 },

  scannerCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
    alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  scannerTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20 },
  nfcCircle: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, elevation: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  nfcIcon:   { fontSize: 56 },
  scanStatus:{ fontSize: 14, fontWeight: '600', marginBottom: 10, textAlign: 'center', paddingHorizontal: 16 },
  tagRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    backgroundColor: COLORS.background, padding: 8, borderRadius: 8,
  },
  tagLabel: { fontSize: 12, color: COLORS.textMuted },
  tagValue: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  tagCopy:  { fontSize: 12, color: COLORS.secondary },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, width: '100%', marginTop: 4,
  },
  resultIcon: { fontSize: 30 },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultSub:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  resultMsg:  { fontSize: 12, color: '#166534', marginTop: 2, fontStyle: 'italic' },
  disabledNote: { marginTop: 12, backgroundColor: COLORS.warning + '22', padding: 10, borderRadius: 10 },
  disabledText: { color: COLORS.warning, fontWeight: '600', fontSize: 13 },

  historyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    borderLeftWidth: 3, paddingLeft: 10,
  },
  historyIcon: { fontSize: 18 },
  historyName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  historyTag:  { fontSize: 11, color: COLORS.textMuted },
  historyType: { fontSize: 11, fontWeight: 'bold' },
});
