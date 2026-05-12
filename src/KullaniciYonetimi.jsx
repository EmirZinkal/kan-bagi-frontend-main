import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { TR_DATA } from "./turkiyeData";

const API_URL = "http://localhost:5245";

function KullaniciYonetimi() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);

  // Form State'leri
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [address, setAddress] = useState(""); // YENİ EKLENDİ
  const [selectedGender, setSelectedGender] = useState("");
  const [phone, setPhone] = useState("");

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    };
    return fetch(url, { ...options, headers });
  };

  const kullanicilariGetir = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API_URL}/api/hospitals/getall`);
      const result = await res.json();
      if (res.ok) setUsers(result.Data || result.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { kullanicilariGetir(); }, []);

  const düzenleModu = (u) => {
    setEditingId(u.HospitalId || u.hospitalId);
    setEditingUserId(u.UserId || u.userId);

    const isimParcalari = u.ContactPersonName ? u.ContactPersonName.split(" ") : ["", ""];
    setFirstName(isimParcalari[0]);
    setLastName(isimParcalari.slice(1).join(" "));

    setHospitalName(u.HospitalName || "");
    setEmail(u.ContactEmail || "");
    setPhone(u.ContactPhone || u.Phone || "");
    setSelectedCity(u.City || "");
    setSelectedDistrict(u.District || "");
    setAddress(u.Address || u.address || ""); // ADRESİ DOLDURUR
    setSelectedGender(u.Gender || "");
    setPassword("");

    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Düzenleme modu aktif", { icon: '📝' });
  };

  const formuTemizle = () => {
    setEditingId(null); setEditingUserId(null);
    setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    setHospitalName(""); setSelectedCity(""); setSelectedDistrict("");
    setAddress(""); setSelectedGender(""); setPhone("");
  };

  const islemKaydet = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !hospitalName || !address) {
      toast.error("Yıldızlı alanları ve adresi doldurun!");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId ? "/api/hospitals/update-profile" : "/api/hospitals/registerhospital";

      const payload = {
        HospitalId: editingId ? Number(editingId) : 0,
        UserId: editingUserId ? Number(editingUserId) : 0,
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Email: email.trim(),
        Phone: phone.trim(), // Backend "Phone" bekliyor olabilir
        HospitalName: hospitalName.trim(),
        ContactPersonName: `${firstName.trim()} ${lastName.trim()}`,
        ContactEmail: email.trim(),
        ContactPhone: phone ? phone.trim() : "",
        Gender: selectedGender || "Belirtilmemiş",
        City: selectedCity || "",
        District: selectedDistrict || "",
        Address: address.trim() // KRİTİK: ARTIK BOŞ GİTMİYOR
      };

      if (!editingId) payload.Password = password;

      const res = await fetchWithAuth(`${API_URL}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("İşlem Başarılı! ✨");
        formuTemizle();
        kullanicilariGetir();
      } else {
        // Hata detayını göster (Örn: Address field is required uyarısını burada yakalarız)
        const errorMsg = result.errors ? Object.values(result.errors).flat().join(" ") : result.message;
        toast.error(errorMsg || "Format hatası!");
      }
    } catch (err) { toast.error("Sunucu hatası!"); } finally { setIsSubmitting(false); }
  };

  // Silme fonksiyonu...
  const kullaniciSil = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    const res = await fetchWithAuth(`${API_URL}/api/hospitals/delete/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Silindi."); kullanicilariGetir(); }
  };

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      <div style={styles.headerArea}>
        <h1 style={styles.mainTitle}>⚙️ Yönetim Merkezi</h1>
        <p style={styles.subTitle}>Hastane personellerini ve sistem yetkilerini buradan yönetin.</p>
      </div>

      <div style={styles.layoutGrid}>
        {/* FORM KARTI */}
        <div style={{ ...styles.glassCard, borderTop: editingId ? "6px solid #3b82f6" : "none" }}>
          <h3 style={styles.cardHeader}>{editingId ? "📝 Kaydı Güncelle" : "👤 Yeni Yetkili Kaydı"}</h3>
          <form onSubmit={islemKaydet} style={styles.formPadding}>
            <div style={styles.inputRow}>
              <div style={styles.inputGroup}><label style={styles.label}>Ad *</label>
                <input style={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Soyad *</label>
                <input style={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}><label style={styles.label}>Cinsiyet</label>
                <select style={styles.input} value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
                  <option value="">Seçiniz</option><option value="Erkek">Erkek</option><option value="Kadın">Kadın</option>
                </select></div>
              <div style={styles.inputGroup}><label style={styles.label}>Telefon</label>
                <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>

            <div style={styles.inputGroup}><label style={styles.label}>Hastane Adı *</label>
              <input style={styles.input} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} /></div>

            {/* ADRES ALANI - HATAYI ÇÖZEN KISIM */}
            <div style={styles.inputGroup}><label style={styles.label}>Açık Adres *</label>
              <textarea
                style={{ ...styles.input, minHeight: "80px", resize: "none" }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Mahalle, sokak, no..."
              /></div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}><label style={styles.label}>Şehir</label>
                <select style={styles.input} value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(""); }}>
                  <option value="">Seçiniz</option>{Object.keys(TR_DATA).map(city => <option key={city} value={city}>{city}</option>)}
                </select></div>
              <div style={styles.inputGroup}><label style={styles.label}>İlçe</label>
                <select style={styles.input} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity}>
                  <option value="">Seçiniz</option>{selectedCity && TR_DATA[selectedCity].map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select></div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}><label style={styles.label}>E-Posta *</label>
                <input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {!editingId && (
                <div style={styles.inputGroup}><label style={styles.label}>Şifre *</label>
                  <input type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              )}
            </div>

            <button type="submit" style={{ ...styles.submitBtn, backgroundColor: editingId ? "#3b82f6" : "#10b981" }} disabled={isSubmitting}>
              {isSubmitting ? "İşleniyor..." : editingId ? "Değişiklikleri Kaydet" : "Yetkiliyi Kaydet"}
            </button>
            {editingId && <button type="button" onClick={formuTemizle} style={styles.cancelBtn}>Vazgeç</button>}
          </form>
        </div>

        {/* LİSTE KARTI */}
        <div style={styles.glassCard}>
          <h3 style={styles.cardHeader}>📋 Kayıtlı Yetkililer</h3>
          <div style={styles.scrollList}>
            {users.map((u, index) => (
              <div key={u.HospitalId || u.hospitalId || index} style={styles.userRow}>
                <div style={styles.userInfo}>
                  <div style={styles.userAvatar}>{u.HospitalName?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.hospitalText}>{u.HospitalName}</div>
                    <div style={styles.subInfo}>👤 {u.ContactPersonName} <span style={{ margin: "0 5px", color: "#cbd5e0" }}>•</span> 📱 {u.ContactPhone}</div>
                    <div style={styles.locationText}>📍 {u.City} / {u.District}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => düzenleModu(u)} style={styles.editBtn}>Düzenle</button>
                  <button onClick={() => kullaniciSil(u.HospitalId || u.hospitalId)} style={styles.deleteBtn}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 5%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  headerArea: { marginBottom: "35px" },
  mainTitle: { fontSize: "2.2rem", color: "#111827", fontWeight: "800", margin: 0 },
  subTitle: { color: "#6b7280", fontSize: "1.1rem", marginTop: "5px" },
  layoutGrid: { display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "30px" },
  glassCard: { backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", overflow: "hidden" },
  cardHeader: { padding: "20px 25px", backgroundColor: "#f9fafb", borderBottom: "1px solid #f1f5f9", fontSize: "1.1rem", fontWeight: "700" },
  formPadding: { padding: "25px" },
  inputRow: { display: "flex", gap: "15px", marginBottom: "15px" },
  inputGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "0.95rem", outline: "none" },
  divider: { height: "1px", backgroundColor: "#f1f5f9", margin: "20px 0" },
  submitBtn: { width: "100%", padding: "14px", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "1rem" },
  cancelBtn: { width: "100%", padding: "10px", backgroundColor: "transparent", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: "12px", cursor: "pointer", marginTop: "10px" },
  scrollList: { padding: "20px", maxHeight: "600px", overflowY: "auto" },
  userRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "15px", backgroundColor: "#fff", marginBottom: "12px", border: "1px solid #f1f5f9" },
  userInfo: { display: "flex", gap: "15px", alignItems: "center", flex: 1 },
  userAvatar: { width: "45px", height: "45px", backgroundColor: "#eff6ff", color: "#3b82f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
  hospitalText: { fontSize: "1rem", fontWeight: "700", color: "#111827" },
  subInfo: { fontSize: "0.85rem", color: "#4b5563" },
  locationText: { fontSize: "0.8rem", color: "#9ca3af" },
  editBtn: { padding: "8px 12px", backgroundColor: "#eff6ff", color: "#3b82f6", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem" },
  deleteBtn: { padding: "8px 12px", backgroundColor: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.8rem" }
};

export default KullaniciYonetimi;