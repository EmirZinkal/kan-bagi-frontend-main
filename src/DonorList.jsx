import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5245";

function DonorList() {
    const [donorlar, setDonorlar] = useState([]);
    const [aramaMetni, setAramaMetni] = useState("");
    const [loading, setLoading] = useState(false);

    // Auth desteği eklenmiş fetch fonksiyonu
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

            // Backend'den gelen PascalCase "Data" kontrolü
            const liste = data.Data || data.data || (Array.isArray(data) ? data : []);
            setDonorlar(liste);
        } catch (err) {
            console.error("Bağışçı yükleme hatası:", err);
            toast.error("Bağışçı listesi yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        donorGetir();
    }, []);

    const bagisTamamla = async (donorId) => {
        if (!window.confirm("Bu bağışçı için genel bağış işlemini onaylıyor musunuz?")) return;

        try {
            // Backend CompleteDonation(int donorId, int? requestId) bekliyor
            // Genel bağış olduğu için requestId göndermiyoruz
            const res = await fetchWithAuth(`${API_URL}/api/donors/completedonation?donorId=${donorId}`, {
                method: "POST"
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Bağış başarıyla tamamlandı, stoklar güncellendi! 🩸");
                donorGetir(); // Listeyi yenile (bağışçının statüsü ve tarihi güncellenmiş olur)
            } else {
                toast.error(result.Message || "Bağış işlemi başarısız.");
            }
        } catch (err) {
            toast.error("Sunucuya bağlanılamadı.");
        }
    };

    // Arama Filtrelemesi
    const filtrelenmişDonorlar = donorlar.filter(d => {
        const ad = (d.FullName || d.fullName || "").toLowerCase();
        const arama = aramaMetni.toLowerCase();
        return ad.includes(arama);
    });

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.baslik}>👥 Bağışçı Yönetimi</h2>
                <input
                    type="text"
                    placeholder="İsim ile bağışçı ara..."
                    style={styles.aramaInput}
                    value={aramaMetni}
                    onChange={(e) => setAramaMetni(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Yükleniyor...</p>
            ) : (
                <div style={styles.listeGrid}>
                    {filtrelenmişDonorlar.length === 0 ? (
                        <p>Kriterlere uygun bağışçı bulunamadı.</p>
                    ) : (
                        filtrelenmişDonorlar.map((d) => {
                            const donorId = d.DonorId || d.donorId || d.id;
                            const adSoyad = d.FullName || d.fullName || "İsimsiz";
                            const kan = d.BloodType || d.bloodType || "-";
                            const tarih = d.LastDonationDate || d.lastDonationDate;

                            return (
                                <div key={donorId} style={styles.kart}>
                                    <div style={styles.kartSol}>
                                        <div style={styles.avatar}>{adSoyad.charAt(0)}</div>
                                        <div>
                                            <h4 style={styles.donorAd}>{adSoyad}</h4>
                                            <p style={styles.donorDetay}>🩸 Grup: <b>{kan}</b></p>
                                            <p style={styles.donorDetay}>
                                                🗓 Son Bağış: {tarih ? new Date(tarih).toLocaleDateString() : "Kayıt Yok"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => bagisTamamla(donorId)}
                                        style={styles.onayButon}
                                    >
                                        Bağışı Tamamla
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: "30px", backgroundColor: "#f9fafb", minHeight: "100vh" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    baslik: { margin: 0, color: "#111827" },
    aramaInput: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #d1d5db", width: "300px" },
    listeGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "15px" },
    kart: {
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    kartSol: { display: "flex", alignItems: "center", gap: "15px" },
    avatar: {
        width: "50px", height: "50px", backgroundColor: "#fee2e2", color: "#ef4444",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.2rem", fontWeight: "bold"
    },
    donorAd: { margin: "0 0 5px 0", fontSize: "1.1rem" },
    donorDetay: { margin: "2px 0", fontSize: "0.9rem", color: "#6b7280" },
    onayButon: {
        backgroundColor: "#10b981", color: "white", border: "none",
        padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600"
    }
};

export default DonorList;