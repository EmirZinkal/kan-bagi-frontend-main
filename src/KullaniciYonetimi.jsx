import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

const API_URL = "http://localhost:5245";

function KullaniciYonetimi() {
  //const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State'leri
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [hospitalName, setHospitalName] = useState("");

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
      // Doğru rota: /api/hospitals/getall
      const res = await fetchWithAuth(`${API_URL}/api/hospitals/getall`);
      const result = await res.json();

      if (res.ok) {
        // Backend'den gelen IDataResult yapısı gereği .data kullanılır
        setUsers(result.data || []);
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
    if (!fullName || !email || !password || !hospitalName) {
      toast.error("Lütfen tüm alanları doldurun!");
      return;
    }

    // Ad ve Soyadı ayır (Backend FirstName ve LastName beklediği için)
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";

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
          // EKSİK OLAN VE VALIDASYONA TAKILAN ALANLAR:
          Gender: "Belirtilmedi",
          Phone: "05000000000",
          City: "Belirtilmedi",
          District: "Belirtilmedi"
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Hastane kaydı başarılı!");
        setFullName(""); setEmail(""); setPassword(""); setHospitalName("");
        kullanicilariGetir();
      } else {
        // Backend'den gelen detaylı hata mesajını göster (FluentValidation hataları burada görünür)
        toast.error(result.message || "Validasyon hatası: Lütfen tüm alanları doğru formatta doldurun.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const kullaniciSil = async (id) => {
    if (!window.confirm("Bu hesabı silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/delete/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Hesap silindi.");
        kullanicilariGetir();
      } else {
        toast.error("Silme işlemi başarısız.");
      }
    } catch (err) {
      toast.error("Hata oluştu.");
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
              <label style={styles.label}>Ad Soyad / Yetkili Kişi</label>
              <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Örn: Dr. Ahmet Yılmaz" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Çalıştığı Hastane</label>
              <input style={styles.input} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Örn: Şehir Hastanesi" />
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
              {users.map((u) => (
                <div key={u.id} style={styles.kullaniciKart}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: "1.1rem" }}>{u.fullName}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{u.hospitalName}</span>
                    <p style={{ margin: "5px 0", color: "#374151", fontWeight: "500" }}>✉️ {u.email}</p>
                    <span style={styles.badge}>{u.role}</span>
                  </div>
                  <button onClick={() => kullaniciSil(u.id)} style={styles.silButon}>Sil</button>
                </div>
              ))}
              {users.length === 0 && <p style={{ color: "#6b7280" }}>Henüz kayıtlı kullanıcı yok.</p>}
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