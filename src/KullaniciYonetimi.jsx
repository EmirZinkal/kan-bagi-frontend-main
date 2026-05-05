import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { TR_DATA } from "./turkiyeData";

const API_URL = "http://localhost:5245";

function KullaniciYonetimi() {
  //const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State'leri
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
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

      if (res.ok) {
        // KRİTİK: Backend "Data" (büyük D) olarak gönderiyorsa result.Data yazmalısın
        // Her ihtimale karşı ikisini de kontrol edelim:
        setUsers(result.Data || result.data || []);
      }
    } catch (err) {
      console.error("Liste yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };
  useEffect(() => {
    kullanicilariGetir();
  }, []);

  const kullaniciOlustur = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !hospitalName) {
      toast.error("Lütfen tüm alanları doldurun!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/hospitals/registerhospital`, {
        method: "POST",
        body: JSON.stringify({
          Email: email,
          Password: password,
          FirstName: firstName,
          LastName: lastName,
          HospitalName: hospitalName,
          Gender: selectedGender,
          Phone: phone,
          City: selectedCity,
          District: selectedDistrict
        }),
      });

      // JSON hatasını engellemek için önce metni alıyoruz
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text); // Eğer JSON ise objeye çevir
      } catch (e) {
        result = { message: text }; // Değilse ham metni mesaj yap
      }

      if (res.ok) {
        toast.success(result.message || "Kayıt Başarılı! 🎉");
        setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setHospitalName(""); setSelectedCity(""); setSelectedDistrict(""); setSelectedGender(""); setPhone("");
        kullanicilariGetir();
      } else {
        // Backend bazen hata mesajlarını "Errors" dizisi içinde döner (FluentValidation)
        const errorMsg = result?.message || (result?.Errors ? result.Errors[0].ErrorMessage : "Doğrulama hatası!");
        toast.error(errorMsg);
        console.error("Backend Hata Detayı:", result);
      }
    } catch (err) {
      console.error("Bağlantı Hatası:", err);
      toast.error("Sunucuya ulaşılamıyor.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const kullaniciSil = async (id) => {
    // id parametresinin 'UserId' olduğundan emin olmalısın
    if (!window.confirm("Bu hastaneyi ve yetkili hesabını silmek istediğinize emin misiniz?")) return;

    try {
      // URL'yi /api/hospitals/delete/ olarak güncelledik
      const res = await fetchWithAuth(`${API_URL}/api/hospitals/delete/${id}`, {
        method: "DELETE"
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.Message || "Kayıt başarıyla silindi.");
        kullanicilariGetir(); // Listeyi güncelle
      } else {
        toast.error(result.Message || "Silme işlemi başarısız.");
      }
    } catch (err) {
      console.error("Silme Hatası:", err);
      toast.error("Bağlantı hatası oluştu.");
    }
  };

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      <h1 style={styles.baslik}>⚙️ Kullanıcı ve Hastane Yönetimi</h1>
      <p style={styles.altBaslik}>Sisteme giriş yapabilecek hastaneleri ve personelleri yetkilendirin.</p>

      <div style={styles.grid}>
        {/* SOL TARAF: KULLANICI EKLEME FORMU */}
        <div style={styles.kart}>
          <h3 style={styles.kartBaslik}>➕ Yeni Hesap Oluştur</h3>
          <form onSubmit={kullaniciOlustur}>

            <div style={styles.formGroup}>
              <label style={styles.label}>Ad</label>
              <input style={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Örn: Dr. Ahmet" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Soyad</label>
              <input style={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Örn: Yılmaz" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Çalıştığı Hastane</label>
              <input style={styles.input} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Örn: Şehir Hastanesi" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cinsiyet</label>
              <select
                style={styles.input}
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <option value="">Cinsiyet Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Şehir</label>
              <select
                style={styles.input}
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDistrict(""); // Şehir değişince ilçe sıfırlansın
                }}
              >
                <option value="">Şehir Seçiniz</option>
                {Object.keys(TR_DATA).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>İlçe</label>
              <select
                style={styles.input}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity} // Şehir seçilmeden tıklanamaz
              >
                <option value="">İlçe Seçiniz</option>
                {selectedCity && TR_DATA[selectedCity].map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cep Telefonu</label>
              <input type="tel" style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Giriş E-Postası</label>
              <input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@hastane.com" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Geçici Şifre Belirle</label>
              <input type="text" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sisteme bu şifreyle girecek" />
            </div>

            <button type="submit" style={styles.buton} disabled={isSubmitting}>
              {isSubmitting ? "Hesap Açılıyor..." : "Kullanıcı Hesabını Aç"}
            </button>
          </form>
        </div>

        {/* SAĞ TARAF: MEVCUT KULLANICILAR LİSTESİ */}
        <div style={styles.kart}>
          <h3 style={styles.kartBaslik}>👥 Sistemdeki Kullanıcılar</h3>
          {loading ? <p>Yükleniyor...</p> : (
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {users.map((u, index) => (
                <div key={u.HospitalId || index} style={styles.kullaniciKart}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: "1.2rem", color: "#b91c1c" }}>
                      {u.HospitalName}
                    </strong>

                    {/* Yeni eklenen görevli bilgileri */}
                    <p style={{ margin: "8px 0 4px 0", fontWeight: "600", color: "#1f2937" }}>
                      👤 Yetkili: {u.ContactPersonName}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "0.9rem" }}>
                      📞 Telefon: {u.ContactPhone}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "0.85rem" }}>
                      ✉️ E-posta: {u.ContactEmail}
                    </p>

                    <hr style={{ border: "0.5px solid #f3f4f6", margin: "10px 0" }} />

                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      📍 {u.City} / {u.District}
                    </span>
                  </div>
                  <button onClick={() => kullaniciSil(u.UserId)} style={styles.silButon}>Sil</button>
                </div>
              ))}
              {users.length === 0 && <p style={{ color: "#6b7280" }}>Henüz kayıtlı hastane yok.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// STİLLER
const styles = {
  container: { padding: "40px 5%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  baslik: { color: "#111827", fontSize: "2.2rem", margin: "0 0 10px 0" },
  altBaslik: { color: "#6b7280", marginBottom: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" },
  kart: { backgroundColor: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" },
  kartBaslik: { borderBottom: "2px solid #f3f4f6", paddingBottom: "10px", marginBottom: "20px", color: "#1f2937" },
  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#374151" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" },
  buton: { width: "100%", padding: "12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" },
  kullaniciKart: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "10px" },
  badge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" },
  silButon: { backgroundColor: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }
};

export default KullaniciYonetimi;