import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5245";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          toast.error("Profil bilgileri alınamadı.");
        }
      } catch (err) {
        toast.error("Sunucu bağlantı hatası.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div style={styles.loading}>🔄 Bilgiler yükleniyor...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Üst Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {(user?.fullName || user?.FullName || "U").charAt(0).toUpperCase()}
          </div>
          <h2 style={styles.title}>{user?.fullName || user?.FullName}</h2>
          <span style={styles.badge}>Çalışan</span>
        </div>

        <div style={styles.body}>
          {/* Kişisel Bilgiler Bölümü */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Kişisel Bilgiler</h3>
            <div style={styles.grid}>
              <InfoBox label="Ad Soyad" value={user?.fullName || user?.FullName} />
              <InfoBox label="E-posta" value={user?.email || user?.Email} />
              <InfoBox label="Telefon" value={user?.phoneNumber || user?.PhoneNumber || "Belirtilmemiş"} />
              <InfoBox label="Kullanıcı ID" value={`${user?.id || user?.Id}`} />
            </div>
          </div>

          {/* Hastane Bilgiler Bölümü */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏥 Hastane Bilgileri</h3>
            <div style={styles.grid}>
              <InfoBox label="Hastane Adı" value={user?.hospitalName || user?.HospitalName} />
              <InfoBox label="İl / İlçe" value={`${user?.city || user?.City} / ${user?.district || user?.District}`} />
            </div>
          </div>

          <div style={styles.footer}>
            ℹ️ Bu bilgiler sadece görüntüleme amaçlıdır. Değişiklik için sistem yöneticisine başvurun.
          </div>
        </div>
      </div>
    </div>
  );
}

// Bilgi Kutucuğu Bileşeni
const InfoBox = ({ label, value }) => (
  <div style={styles.infoBox}>
    <label style={styles.label}>{label}</label>
    <div style={styles.value}>{value || "---"}</div>
  </div>
);

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f4f7fe", padding: "20px" },
  card: { backgroundColor: "#fff", width: "100%", maxWidth: "650px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden" },
  header: { backgroundColor: "#2563eb", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", color: "#fff" },
  avatar: { width: "80px", height: "80px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "2rem", fontWeight: "bold", marginBottom: "15px", border: "3px solid rgba(255,255,255,0.4)" },
  title: { margin: "0 0 5px 0", fontSize: "1.5rem" },
  badge: { backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "15px", fontSize: "0.85rem" },
  body: { padding: "30px" },
  section: { marginBottom: "30px" },
  sectionTitle: { fontSize: "1rem", color: "#1e293b", fontWeight: "700", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px", textTransform: "uppercase" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  infoBox: { display: "flex", flexDirection: "column" },
  label: { fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "5px" },
  value: { fontSize: "0.95rem", color: "#1e293b", fontWeight: "500" },
  addressBox: { marginTop: "20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1fr solid #e2e8f0" },
  addressText: { margin: "5px 0 0 0", color: "#334155", fontSize: "0.9rem", lineHeight: "1.5" },
  footer: { textAlign: "center", fontSize: "0.8rem", color: "#94a3b8", marginTop: "20px", fontStyle: "italic" },
  loading: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.2rem", color: "#2563eb" }
};

export default Profile;