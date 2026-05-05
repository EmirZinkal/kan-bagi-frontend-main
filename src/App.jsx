import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Senin mevcut sayfaların
import Login from "./Login";
import Dashboard from "./Dashboard";
import DonorList from "./DonorList";
import RequestList from "./RequestList";
import Donors from "./Donor";

// Yeni eklediğimiz sayfa
import KullaniciYonetimi from "./KullaniciYonetimi";

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};
// --- ÜST MENÜ (NAVBAR) BİLEŞENİ ---
function Navbar() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const decoded = token ? parseJwt(token) : null;

  // Konsol çıktındaki tam anahtar ismi:
  const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
  const rol = decoded ? decoded[roleClaim] : null;

  // Rol bir dizi de olabilir ("Admin", "Hastane" gibi), string de olabilir.
  const isAdmin = Array.isArray(rol) ? rol.includes("Admin") : rol === "Admin";
  // Eğer kullanıcı Login (giriş) sayfasındaysa menüyü GİZLE
  if (location.pathname === "/") {
    return null;
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoKismi}>
        <span style={{ fontSize: "1.8rem" }}>🩸</span>
        <h2 style={{ margin: 0, color: "white" }}>Kan Bağışı Yönetim Merkezi</h2>
      </div>

      <div style={styles.menuKismi}>
        {/* Link etiketleri react-router-dom'un sayfa yenilemeden geçiş yapmasını sağlar */}
        <Link
          to="/dashboard"
          style={{ ...styles.menuButon, backgroundColor: location.pathname === "/dashboard" ? "rgba(255,255,255,0.2)" : "transparent" }}
        >
          📊 Ana Panel
        </Link>
        {/* SADECE ROLÜ ADMIN OLANLAR GÖRSÜN */}
        {rol === "Admin" && (
          <Link to="/kullanici-yonetimi" style={styles.menuButon}>
            ⚙️ Kullanıcı Yönetimi
          </Link>
        )}

        {/* İstersen diğer sayfalarını da buraya ekleyebilirsin */}
        <Link
          to="/donors"
          style={{ ...styles.menuButon, backgroundColor: location.pathname === "/donors" ? "rgba(255,255,255,0.2)" : "transparent" }}
        >
          👥 Bağışçılar
        </Link>

        <Link
          to="/requests"
          style={{ ...styles.menuButon, backgroundColor: location.pathname === "/requests" ? "rgba(255,255,255,0.2)" : "transparent" }}
        >
          📋 Talepler
        </Link>

      </div>
    </nav>
  );
}

// --- ANA UYGULAMA (APP) BİLEŞENİ ---
function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Tüm sayfalarda çalışacak hata/başarı mesajları (Toast) */}
        <Toaster position="top-right" />

        {/* Üst Menümüzü Çağırıyoruz */}
        <Navbar />

        {/* SAYFA İÇERİKLERİ */}
        <main style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/donors" element={<DonorList />} />
            <Route path="/requests" element={<RequestList />} />
            <Route path="/donor" element={<Donors />} />

            {/* Yeni Kullanıcı Yönetimi Sayfamızın Rotası */}
            <Route path="/kullanici-yonetimi" element={<KullaniciYonetimi />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

// --- STİLLER ---
const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: "15px 5%",
    color: "white",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  logoKismi: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  menuKismi: {
    display: "flex",
    gap: "15px"
  },
  menuButon: {
    color: "white",
    textDecoration: "none", // Linklerin alt çizgisini kaldırır
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "bold",
    transition: "background-color 0.2s"
  }
};

export default App;