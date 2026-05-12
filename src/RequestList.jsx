import { useEffect, useState } from "react";

const API_URL = "http://localhost:5245";

// --- TÜRKÇELEŞTİRME SÖZLÜĞÜ ---
const TURKCE_DURUMLAR = {
    "Pending": "⏳ Onay Bekliyor",
    "ReadyForApproval": "📑 Onay Bekliyor",
    "Accepted": "✅ Onaylandı",
    "Rejected": "❌ Reddedildi",
    "Completed": "💉 Tamamlandı",
    "Normal": "Normal",
    "Urgent": "Acil",
    "Critical": "Kritik"
};

// Veri okuma yardımcı fonksiyonları (ÇEVİRİ DESTEĞİ EKLENDİ)
const kanGrubuAl = (item) => item?.bloodType || item?.BloodType || item?.kanGrubu || item?.kan || "-";

const durumAl = (item) => {
    const hamDurum = item?.status || item?.Status || "Pending";
    return TURKCE_DURUMLAR[hamDurum] || hamDurum;
};

const aciliyetAl = (item) => {
    const hamAciliyet = item?.urgency || item?.Urgency || "Normal";
    return TURKCE_DURUMLAR[hamAciliyet] || hamAciliyet;
};

const ozelSartlarAl = (item) => item?.conditions || item?.Conditions || item?.sartlar || item?.Sartlar || "";

// Hastane ve Adres fonksiyonları aynı kalıyor...
const hastaneAl = (item) => {
    const isim = item?.hospitalName || item?.HospitalName;
    if (isim) return isim;
    return item?.requesterName || item?.RequesterName || item?.user?.fullName || item?.User?.FullName || "Hastane Bilgisi Yok";
};

const adresAl = (item) => {
    const temelAdres = item?.address || item?.Address || item?.adres || "Adres: ";
    const ilce = item?.district || item?.District || item?.ilce || item?.Ilce || "";
    const sehir = item?.city || item?.City || item?.sehir || item?.Sehir || "";
    if (ilce && sehir) return `${temelAdres} (${ilce} / ${sehir})`;
    if (ilce) return `${temelAdres} (${ilce})`;
    if (sehir) return `${temelAdres} (${sehir})`;
    return temelAdres;
};

const tarihAl = (t) => {
    const tarih = t?.createdDate || t?.CreatedDate || t?.tarih;
    if (!tarih) return "-";
    try {
        return new Date(tarih).toLocaleDateString("tr-TR", {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch { return tarih; }
};

function RequestList() {
    const [talepler, setTalepler] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const talepleriGetir = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/requests/getdetails`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                });
                if (!res.ok) throw new Error("Kan talepleri getirilemedi");
                const data = await res.json();

                // Veri formatı kontrolü
                const liste = Array.isArray(data) ? data : (data.data || data.Data || []);
                setTalepler(liste);
            } catch (err) {
                console.error("Talep çekme hatası:", err);
                setTalepler([]);
            } finally {
                setLoading(false);
            }
        };
        talepleriGetir();
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.baslik}>📋 Tüm Kan Talepleri</h2>
                <p style={styles.altBaslik}>Sistemde kayıtlı olan tüm hastane ve acil kan talepleri aşağıda listelenmektedir.</p>
            </div>

            {loading ? (
                <div style={styles.bilgiMesaji}>⏳ Talepler sunucudan yükleniyor, lütfen bekleyin...</div>
            ) : (
                <div style={styles.listContainer}>
                    {talepler.length === 0 ? (
                        <div style={styles.bosDurum}>
                            <p>📭 Sistemde henüz hiçbir kan talebi bulunmuyor.</p>
                        </div>
                    ) : (
                        talepler.map((t, index) => {
                            const kan = kanGrubuAl(t);
                            const ozelSart = ozelSartlarAl(t);
                            const durum = durumAl(t);
                            const aciliyet = aciliyetAl(t);

                            return (
                                <div key={t.id || t.Id || index} style={styles.talepKart}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: "1.25rem", color: "#111827", display: "block" }}>
                                                🏥 {hastaneAl(t)}
                                            </strong>
                                            <span style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "4px", display: "block" }}>
                                                📍 {adresAl(t)}
                                            </span>
                                        </div>
                                        <span style={styles.badge}>{kan}</span>
                                    </div>

                                    <div style={styles.aciliyetKutusu}>
                                        🚨 Aciliyet: <strong>{aciliyet}</strong>
                                    </div>

                                    {ozelSart && (
                                        <div style={styles.ozelSartKutusu}>
                                            📝 <strong>Özel Şartlar:</strong> {ozelSart}
                                        </div>
                                    )}

                                    <div style={styles.kartAlt}>
                                        <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                                            🗓️ Oluşturulma: {tarihAl(t)}
                                        </span>
                                        <span style={{ fontSize: "0.95rem", color: "#4b5563" }}>
                                            Durum: <b style={{
                                                color: durum.includes("Onay") ? "#d97706" :
                                                    durum.includes("Red") ? "#ef4444" : "#10b981"
                                            }}>{durum}</b>
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

// Stil güncellemeleri
const styles = {
    // ... eski stiller aynı kalıyor, sadece alt kısım için bir ekleme:
    kartAlt: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "15px",
        paddingTop: "15px",
        borderTop: "1px solid #f3f4f6"
    },
    ozelSartKutusu: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        padding: "12px",
        borderRadius: "8px",
        marginTop: "10px",
        fontSize: "0.95rem",
        fontStyle: "italic",
        borderLeft: "4px solid #fbbf24"
    },
    // Diğer stilleri yukarıdaki koddan aynen alabilirsin...
    container: { padding: "40px 5%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
    header: { marginBottom: "30px" },
    baslik: { color: "#111827", fontSize: "2.2rem", fontWeight: "800", margin: "0 0 10px 0" },
    altBaslik: { color: "#6b7280", fontSize: "1.1rem", margin: 0 },
    bilgiMesaji: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "16px", borderRadius: "8px", fontWeight: "500", border: "1px solid #bfdbfe" },
    bosDurum: { backgroundColor: "#ffffff", color: "#6b7280", padding: "40px", borderRadius: "12px", textAlign: "center", fontSize: "1.1rem", border: "1px dashed #d1d5db" },
    listContainer: { display: "flex", flexDirection: "column", gap: "20px" },
    talepKart: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e5e7eb", transition: "transform 0.2s" },
    badge: { backgroundColor: "#fee2e2", color: "#ef4444", padding: "8px 16px", borderRadius: "9999px", fontWeight: "bold", fontSize: "1.1rem" },
    aciliyetKutusu: { backgroundColor: "#fff7ed", color: "#c2410c", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #f97316", marginTop: "10px", fontSize: "0.95rem" }
};

export default RequestList;