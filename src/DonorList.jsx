import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5245";

function DonorList() {
    const [donorlar, setDonorlar] = useState([]);
    const [aramaMetni, setAramaMetni] = useState("");
    const [seciliGrup, setSeciliGrup] = useState("Tümü");
    const [loading, setLoading] = useState(false);

    const kanGruplari = ["Tümü", "A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];

    const fetchWithAuth = async (url, options = {}) => {
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
            ...options.headers,
        };
        return fetch(url, { ...options, headers });
    };

    const donorGetir = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth(`${API_URL}/api/donors/getlist`);
            const data = await res.json();
            const liste = data.Data || data.data || (Array.isArray(data) ? data : []);
            setDonorlar(liste);
        } catch (err) {
            toast.error("Bağışçı listesi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        donorGetir();
    }, []);

    const bagisTamamla = async (donorId) => {
        if (!window.confirm("Bu bağışçının fiziksel bağış işlemini onaylıyor musunuz? Stoklar güncellenecektir.")) return;

        try {
            const res = await fetchWithAuth(`${API_URL}/api/donors/completedonation?donorId=${donorId}`, {
                method: "POST"
            });
            if (res.ok) {
                toast.success("Bağış kaydedildi, stoklar güncellendi! 🩸");
                donorGetir();
            } else {
                toast.error("Bağış işlemi sırasında bir hata oluştu.");
            }
        } catch (err) {
            toast.error("Sunucuya bağlanılamadı.");
        }
    };

    // Gelişmiş Filtreleme (Hem İsim Hem Kan Grubu)
    const filtrelenmisDonorlar = donorlar.filter(d => {
        const ad = (d.FullName || d.fullName || "").toLowerCase();
        const kan = d.BloodType || d.bloodType || "";
        const aramaUygun = ad.includes(aramaMetni.toLowerCase());
        const grupUygun = seciliGrup === "Tümü" || kan === seciliGrup;
        return aramaUygun && grupUygun;
    });

    return (
        <div style={styles.container}>
            {/* Üst Kısım: Başlık ve İstatistik Özeti */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.baslik}>👥 Bağışçı Yönetimi</h2>
                    <p style={styles.altBaslik}>Sistemde kayıtlı toplam {donorlar.length} bağışçı bulunuyor.</p>
                </div>
            </div>

            {/* Filtreleme Barı */}
            <div style={styles.filtreBar}>
                <div style={styles.aramaWrapper}>
                    <span style={styles.aramaIkon}>🔍</span>
                    <input
                        type="text"
                        placeholder="İsim veya soyisim ile ara..."
                        style={styles.aramaInput}
                        value={aramaMetni}
                        onChange={(e) => setAramaMetni(e.target.value)}
                    />
                </div>
                <div style={styles.grupFiltre}>
                    {kanGruplari.map(grup => (
                        <button
                            key={grup}
                            onClick={() => setSeciliGrup(grup)}
                            style={{
                                ...styles.grupButon,
                                backgroundColor: seciliGrup === grup ? "#ef4444" : "white",
                                color: seciliGrup === grup ? "white" : "#4b5563",
                                border: seciliGrup === grup ? "1px solid #ef4444" : "1px solid #d1d5db"
                            }}
                        >
                            {grup}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={styles.loading}>⏳ Bağışçı verileri yükleniyor...</div>
            ) : (
                <div style={styles.grid}>
                    {filtrelenmisDonorlar.map((d) => {
                        const donorId = d.DonorId || d.donorId || d.id;
                        const adSoyad = d.FullName || d.fullName || "İsimsiz";
                        const kan = d.BloodType || d.bloodType || "-";
                        const tarih = d.LastDonationDate || d.lastDonationDate;
                        const email = d.Email || d.email || "E-posta yok";

                        return (
                            <div key={donorId} style={styles.kart}>
                                <div style={styles.kartUst}>
                                    <div style={styles.avatar}>
                                        {adSoyad.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={styles.badge}>{kan}</div>
                                </div>

                                <div style={styles.kartOrta}>
                                    <h4 style={styles.donorAd}>{adSoyad}</h4>
                                    <p style={styles.donorEmail}>📧 {email}</p>
                                    <div style={styles.tarihKutusu}>
                                        <span style={styles.tarihEtiket}>Son Bağış:</span>
                                        <span style={styles.tarihDeger}>
                                            {tarih ? new Date(tarih).toLocaleDateString("tr-TR") : "Yeni Kayıt"}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => bagisTamamla(donorId)}
                                    style={styles.onayButon}
                                >
                                    💉 Bağış Al
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: "40px 5%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    baslik: { fontSize: "2rem", color: "#111827", fontWeight: "800", margin: 0 },
    altBaslik: { color: "#6b7280", marginTop: "5px" },
    filtreBar: { display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px", backgroundColor: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" },
    aramaWrapper: { position: "relative", width: "100%" },
    aramaIkon: { position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" },
    aramaInput: { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "10px", border: "1px solid #e5e7eb", outline: "none", fontSize: "1rem", boxSizing: "border-box" },
    grupFiltre: { display: "flex", gap: "8px", flexWrap: "wrap" },
    grupButon: { padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" },
    kart: { backgroundColor: "white", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", transition: "transform 0.2s" },
    kartUst: { position: "relative", marginBottom: "15px" },
    avatar: { width: "70px", height: "70px", backgroundColor: "#f3f4f6", color: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: "bold", border: "2px solid #fff" },
    badge: { position: "absolute", bottom: "-5px", right: "-5px", backgroundColor: "#ef4444", color: "white", padding: "4px 8px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "bold", border: "2px solid #fff" },
    kartOrta: { width: "100%", marginBottom: "20px" },
    donorAd: { fontSize: "1.2rem", color: "#111827", margin: "0 0 5px 0", fontWeight: "700" },
    donorEmail: { fontSize: "0.85rem", color: "#6b7280", margin: "0 0 15px 0" },
    tarihKutusu: { backgroundColor: "#f9fafb", padding: "10px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "3px" },
    tarihEtiket: { fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: "bold" },
    tarihDeger: { fontSize: "0.9rem", color: "#374151", fontWeight: "600" },
    onayButon: { width: "100%", backgroundColor: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", transition: "background 0.2s", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)" },
    loading: { textAlign: "center", padding: "50px", color: "#6b7280", fontSize: "1.1rem" }
};

export default DonorList;