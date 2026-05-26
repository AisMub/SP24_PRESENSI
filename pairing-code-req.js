const { io } = require("socket.io-client");

// GANTI dengan URL server Anda
const SERVER_URL = "https://sp24api.wind.my.id"

const socket = io(SERVER_URL);

console.log("🌐 Memulai Simulator Web App...");

socket.on("connect", () => {
  console.log("✅ Terhubung ke Server dengan ID:", socket.id);

  // LANGKAH 1: Meminta kode pairing ke server
  console.log("📤 Meminta kode pairing...");
  socket.emit("request-pairing-code");
});

// LANGKAH 2: Menerima kode pairing yang dihasilkan server
socket.on("pairing-code-generated", (code) => {
  console.log("\n=========================================");
  console.log(`🎟️  PAIRING CODE ANDA: ${code}`);
  console.log("=========================================");
  console.log("📱 Silakan masukkan kode di atas pada aplikasi Android.");
  console.log("⌛ Menunggu kiriman data NFC dari Android...\n");
});

// LANGKAH 3: Menerima data NFC yang diteruskan oleh server
socket.on("nfc-received", (data) => {
  console.log("-----------------------------------------");
  console.log("📥 DATA NFC DITERIMA!");
  console.log("🆔 Tag ID    :", data.tagId);
  console.log("⏰ Timestamp :", data.timestamp);
  console.log("-----------------------------------------");
});

socket.on("disconnect", () => {
  console.log("❌ Terputus dari server.");
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Gagal terhubung ke server:", err.message);
});
