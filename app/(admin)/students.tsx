import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { studentService, Student } from '../../services/studentService';

const EMPTY_FORM = { nis: '', first_name: '', last_name: '', class: '', parent: '', tag_id: '', age: '' };

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.nis} ${s.class}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({
      nis: s.nis, first_name: s.first_name, last_name: s.last_name,
      class: s.class, parent: s.parent, tag_id: s.tag_id, age: String(s.age),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nis || !form.first_name || !form.last_name || !form.class) {
      Alert.alert('Perhatian', 'NIS, nama, dan kelas wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, age: Number(form.age) };
      if (editTarget) {
        await studentService.update(editTarget.id, payload);
      } else {
        await studentService.create(payload as any);
      }
      setModalVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Gagal menyimpan data siswa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s: Student) => {
    Alert.alert('Hapus Siswa', `Hapus ${s.first_name} ${s.last_name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          try { await studentService.delete(s.id); load(); }
          catch { Alert.alert('Error', 'Gagal menghapus siswa.'); }
        },
      },
    ]);
  };

  const FIELDS = [
    { key: 'nis', label: 'NIS', placeholder: 'Nomor Induk Siswa', numeric: true },
    { key: 'first_name', label: 'Nama Depan', placeholder: 'Nama depan' },
    { key: 'last_name', label: 'Nama Belakang', placeholder: 'Nama belakang' },
    { key: 'class', label: 'Kelas', placeholder: 'Contoh: 6A' },
    { key: 'parent', label: 'Nama Wali', placeholder: 'Nama orang tua/wali' },
    { key: 'tag_id', label: 'Tag ID NFC', placeholder: 'ID kartu NFC siswa' },
    { key: 'age', label: 'Umur', placeholder: 'Contoh: 12', numeric: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Siswa</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
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
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada data siswa.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: COLORS.secondary }]}>
                <Text style={styles.avatarText}>{item.first_name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.cardSub}>NIS: {item.nis} · Kelas {item.class}</Text>
                <Text style={styles.cardTag}>🏷 {item.tag_id || 'Belum ada kartu'}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.delBtnText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit Siswa' : 'Tambah Siswa'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FIELDS.map(f => (
                <View key={f.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.numeric ? 'numeric' : 'default'}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  addBtn: { backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
  searchWrap: { padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  cardName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  cardTag: { fontSize: 11, color: COLORS.tertiary, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.overlay, borderRadius: 8 },
  editBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 12 },
  delBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FEE2E2', borderRadius: 8 },
  delBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
  formGroup: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  formInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold' },
});
