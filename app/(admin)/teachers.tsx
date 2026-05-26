import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { teacherService, Teacher } from '../../services/teacherService';

const EMPTY_FORM = { username: '', password: '', first_name: '', last_name: '', gender: 'L', age: '' };

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherService.getAll();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Gagal memuat data guru.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTarget(t);
    setForm({ username: t.username, password: '', first_name: t.first_name, last_name: t.last_name, gender: t.gender, age: String(t.age) });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.first_name || !form.last_name) {
      Alert.alert('Perhatian', 'Username, nama depan, dan nama belakang wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await teacherService.update(editTarget.id, {
          username: form.username, first_name: form.first_name,
          last_name: form.last_name, gender: form.gender, age: Number(form.age),
        });
      } else {
        if (!form.password) { Alert.alert('Perhatian', 'Password wajib diisi.'); return; }
        await teacherService.create({
          username: form.username, password: form.password, first_name: form.first_name,
          last_name: form.last_name, gender: form.gender, age: Number(form.age),
        });
      }
      setModalVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Gagal menyimpan data guru.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t: Teacher) => {
    Alert.alert('Hapus Guru', `Hapus ${t.first_name} ${t.last_name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            await teacherService.delete(t.id);
            load();
          } catch {
            Alert.alert('Error', 'Gagal menghapus guru.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Guru</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada data guru.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.first_name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.cardSub}>@{item.username} · {item.gender} · {item.age} th</Text>
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

      {/* Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit Guru' : 'Tambah Guru'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'first_name', label: 'Nama Depan', placeholder: 'Nama depan' },
                { key: 'last_name', label: 'Nama Belakang', placeholder: 'Nama belakang' },
                { key: 'username', label: 'Username', placeholder: 'Username login' },
                ...(!editTarget ? [{ key: 'password', label: 'Password', placeholder: 'Password', secure: true }] : []),
                { key: 'age', label: 'Umur', placeholder: 'Contoh: 30', numeric: true },
              ].map(f => (
                <View key={f.key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    secureTextEntry={!!(f as any).secure}
                    keyboardType={(f as any).numeric ? 'numeric' : 'default'}
                  />
                </View>
              ))}
              {/* Gender */}
              <Text style={styles.formLabel}>Jenis Kelamin</Text>
              <View style={styles.genderRow}>
                {['L', 'P'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                    onPress={() => setForm(p => ({ ...p, gender: g }))}
                  >
                    <Text style={[styles.genderBtnText, form.gender === g && styles.genderBtnTextActive]}>
                      {g === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  cardName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
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
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  genderBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  genderBtnTextActive: { color: COLORS.white },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold' },
});
