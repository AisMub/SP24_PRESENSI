# SP24 PRESENSI 📱📡

SP24 NFC Reader adalah aplikasi mobile berbasis **React Native (Expo)** yang berfungsi sebagai *bridge* (jembatan) untuk membaca kartu NFC dan mengirimkan data Tag ID secara *real-time* ke aplikasi Web/Browser menggunakan **Socket.io**.

Aplikasi ini menggunakan sistem **Pairing Code 6-Digit** untuk memastikan keamanan dan ketepatan pengiriman data antara perangkat mobile dan sesi web pengguna.

## ✨ Fitur Utama

- **Continuous NFC Scanning**: Membaca kartu NFC secara latar belakang tanpa perlu menekan tombol berulang kali.
- **Smart Pairing System**: Menggunakan kode 6 digit untuk menghubungkan perangkat Android dengan sesi Web Browser tertentu.
- **Real-time WebSocket**: Pengiriman data instan tanpa *delay* menggunakan `socket.io-client`.
- **Anti Double-Scan (Debounce)**: Proteksi bawaan untuk mencegah pengiriman data ganda jika kartu ditempelkan terlalu lama atau terdeteksi beberapa kali dalam waktu singkat.
- **Visual Feedback**: Indikator status koneksi server (Online/Offline) dan status kesiapan pemindai NFC.

## 🛠️ Teknologi yang Digunakan

- [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 50+)
- [React Native NFC Manager](https://github.com/revtel/react-native-nfc-manager)
- [Socket.io Client](https://socket.io/)

## 📋 Persyaratan Sistem

Sebelum menjalankan aplikasi ini, pastikan Anda memiliki:
1. Node.js terinstal di sistem Anda.
2. Expo CLI terinstal (`npm install -g expo-cli`).
3. **Perangkat Android Fisik** dengan fitur NFC (Emulator/Simulator tidak mendukung pembacaan perangkat keras NFC).
4. Server Backend berbasis Socket.io yang sudah berjalan (berada dalam satu jaringan Wi-Fi/LAN yang sama dengan HP).

## 🚀 Cara Instalasi dan Menjalankan

### 1. Clone Repositori
```bash
git clone [https://github.com/bayu242/SP24_NFC_READER.git](https://github.com/bayu242/SP24_NFC_READER.git)
cd SP24_NFC_READER
