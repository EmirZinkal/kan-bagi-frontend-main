import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

const API_URL = "http://localhost:5245";

const listeyeCevir = (res) => {
  if (res && Array.isArray(res.Data)) return res.Data; // PascalCase (C#) desteği eklendi
  if (res && Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

const kanGrubuAl = (item) => item?.bloodType || item?.BloodType || item?.grup || "-";
const durumAl = (item) => item?.status || item?.Status || "Bekleme";
const aciliyetAl = (item) => item?.urgency || item?.Urgency || "-";

const demoKanStoklari = [
  { grup: "A+", miktar: 10 },
  { grup: "A-", miktar: 3 },
  { grup: "B+", miktar: 7 },
  { grup: "B-", miktar: 2 },
  { grup: "AB+", miktar: 5 },
  { grup: "AB-", miktar: 1 },
  { grup: "0+", miktar: 12 },
  { grup: "0-", miktar: 1 },
];

const stokRengi = (miktar) => {
  if (miktar <= 2) return "#ef4444";
  if (miktar <= 5) return "#f59e0b";
  return "#10b981";
};

function Dashboard() {
  // FORM STATE'LERİ
  const [hastaneBilgisi, setHastaneBilgisi] = useState(null);
  const [kanGrubu, setKanGrubu] = useState("");
  const [sartlar, setSartlar] = useState("");
  const [editingTalepId, setEditingTalepId] = useState(null);

  // VERİ STATE'LERİ
  const [talepler, setTalepler] = useState([]);
  const [kanStoklari, setKanStoklari] = useState(demoKanStoklari);
  const [donors, setDonors] = useState([]);
  const [istatistik, setIstatistik] = useState(null);
  const [selectedKan, setSelectedKan] = useState(null);

  // UI STATE'LERİ
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PROFİL STATE'LERİ
  const [profilAcik, setProfilAcik] = useState(false);
  const [kullaniciBilgisi, setKullaniciBilgisi] = useState(null);

  const [selectedTalepId, setSelectedTalepId] = useState(null);
  const [notifiedDonors, setNotifiedDonors] = useState([]);

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  };

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const bagisTamamla = async (donorId, requestId) => {
    if (!window.confirm("Bağışın fiziksel olarak tamamlandığını ve stokların güncelleneceğini onaylıyor musunuz?")) return;

    try {
      // Backend CompleteDonation metodu donorId'yi Query String olarak bekliyor olabilir 
      // (Controller'da int donorId olarak tanımlandığı için)
      const res = await fetchWithAuth(`${API_URL}/api/donors/completedonation?donorId=${donorId}`, {
        method: "POST"
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Bağış başarıyla kaydedildi, stoklar güncellendi! 💉");
        // Tüm verileri (stok, talep listesi, istatistikler) yenile
        verileriYukle();
        bagiscilariYukle();
        // Eğer bir talep seçiliyse onun bildirim giden listesini de tazele
        if (requestId) talepBildirimleriniYukle(requestId);
      } else {
        toast.error(result.message || "Bağış tamamlanırken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Bağış tamamlama hatası:", err);
      toast.error("Sunucu bağlantı hatası.");
    }
  };

  const verileriYukle = async () => {
    const kullaniciHamVeri = localStorage.getItem("kullanici");

    if (!kullaniciHamVeri) return;

    const kullaniciObje = JSON.parse(kullaniciHamVeri);
    const token = kullaniciObje?.Token || kullaniciObje?.token;

    if (!token) {
      console.error("Token bulunamadı!");
      return;
    }

    // Token içinden ID'yi (nameidentifier) çekiyoruz
    const decodedToken = parseJwt(token);
    // JWT standartlarında nameid veya nameidentifier olarak tutulur
    const aktifKullaniciId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decodedToken?.nameid;
    if (!aktifKullaniciId) {
      console.error("Token içinden ID çözülemedi!");
      return;
    }

    console.log("Çözülen Kullanıcı ID:", aktifKullaniciId);
    try {
      setLoading(true);

      // 1. İSTEK: Önce talepleri getir ve bitmesini bekle
      const talepRes = await fetchWithAuth(`${API_URL}/api/requests/getdetails`);
      const talepData = await talepRes.json();
      setTalepler(listeyeCevir(talepData));

      // 2. İSTEK: Talepler bittikten sonra stokları getir
      const stokRes = await fetchWithAuth(`${API_URL}/api/stocks/getlist`);
      const stokData = await stokRes.json();
      const anaVeri = stokData.data || stokData.Data || [];

      if (Array.isArray(anaVeri)) {
        const duzenlenmisStoklar = anaVeri.map((s) => ({
          // Backend'den gelen 'Quantity' bilgisini eşleştiriyoruz
          grup: s.bloodType || s.BloodType || "-",
          miktar: s.quantity || s.Quantity || s.unitCount || 0,
        }));
        setKanStoklari(duzenlenmisStoklar);
      }

      // 3. İSTEK: En son istatistikleri getir
      const statsRes = await fetchWithAuth(`${API_URL}/api/statistics/getsummary`);
      const statsData = await statsRes.json();
      setIstatistik(statsData?.data || null);

      const token = localStorage.getItem("token");
      if (token) {
        const decoded = parseJwt(token);
        const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.nameid;

        if (userId) {
          const hospitalRes = await fetchWithAuth(`${API_URL}/api/hospitals/getbyuserid/${userId}`);
          const hospitalData = await hospitalRes.json();
          if (hospitalRes.ok) {
            // Backend PropertyNamingPolicy = null olduğu için PascalCase (Data) kontrolü yapıyoruz
            setHastaneBilgisi(hospitalData.Data || hospitalData.data);
          }
        }
      }

    } catch (err) {
      console.error("Veri yükleme hatası:", err);
      toast.error("Veriler güncellenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const bagiscilariYukle = async () => {
    try {
      const endpoint = selectedKan
        ? `${API_URL}/api/donors/getbysbloodtype/${encodeURIComponent(selectedKan)}`
        : `${API_URL}/api/donors/getlist`;
      const res = await fetchWithAuth(endpoint);
      const data = await res.json();
      setDonors(listeyeCevir(data));
    } catch (err) {
      console.error("Bağışçı yükleme hatası:", err);
      setDonors([]);
    }
  };

  const talepBildirimleriniYukle = async (requestId) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/notifications/getnotifieddonors/${requestId}`);
      const data = await res.json();
      setNotifiedDonors(listeyeCevir(data));
    } catch (err) {
      setNotifiedDonors([]);
    }
  };

  useEffect(() => { verileriYukle(); }, []);
  useEffect(() => { bagiscilariYukle(); }, [selectedKan]);

  // PROFİL İŞLEMLERİ
  const profiliYukle = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/auth/profile`);
      if (res.ok) {
        const data = await res.json();
        setKullaniciBilgisi(data);
        setProfilAcik(true);
      } else {
        toast.error("Yapım Aşamasında. ⏳");
      }
    } catch (err) {
      toast.error("Sunucu bağlantı hatası.");
    }
  };

  const cikisYap = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  // TALEP İŞLEMLERİ
  const talepKaydet = async () => {
    if (!kanGrubu || !sartlar) {
      toast.error("Lütfen kan grubunu ve aciliyet durumunu seçin!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend'de PropertyNamingPolicy = null olduğu için PascalCase gönderiyoruz
      const payload = {
        BloodType: kanGrubu,
        Urgency: sartlar,
      };

      // Güncelleme modu ise ID ekle
      if (editingTalepId) {
        payload.Id = editingTalepId;
      }

      const endpoint = editingTalepId
        ? `${API_URL}/api/requests/update`
        : `${API_URL}/api/requests/add`;

      const res = await fetchWithAuth(endpoint, {
        method: editingTalepId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      // Backend IResult.Message döndüğü için önce metni alıyoruz
      const message = await res.text();

      if (res.ok) {
        toast.success(message || "İşlem başarıyla tamamlandı. ✅");
        formuTemizle();
        verileriYukle();
      } else {
        // Backend BadRequest(result.Message) döndüğü için direkt mesajı gösteriyoruz
        toast.error(message || "İşlem başarısız oldu.");
      }
    } catch (err) {
      console.error("Hata:", err);
      toast.error("Sunucuya bağlanırken bir hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const talepSil = async (id, e) => {
    e.stopPropagation();
    toast(
      (t) => (
        <div>
          <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Bu talebi silmek istediğinize emin misiniz?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={async () => {
              toast.dismiss(t.id);
              await gercektenSil(id);
            }} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Evet, Sil
            </button>
            <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const gercektenSil = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/requests/delete/${id}`, { method: "DELETE" });

      // Yanıt ne olursa olsun metin olarak oku
      const message = await res.text();

      if (res.ok) {
        toast.success("Talep başarıyla silindi.");
        if (editingTalepId === id) formuTemizle();
        verileriYukle(); // Listeyi yenile
      } else {
        // Backend'den gelen ErrorResult mesajını göster
        toast.error(message || "Silme işlemi başarısız oldu.");
      }
    } catch (err) {
      toast.error("Sunucuya bağlanılamadı.");
    }
  };

  const talepDuzenle = (t, e) => {
    e.stopPropagation();

    setEditingTalepId(t.id || t.Id);
    setKanGrubu(kanGrubuAl(t));
    setSartlar(aciliyetAl(t));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formuTemizle = () => {
    setEditingTalepId(null);
    setKanGrubu("");
    setSartlar("");
  };

  return (
    <div style={styles.container}>
      <Toaster position="top-right" reverseOrder={false} />

      <header style={styles.header}>
        <div>
          <h1 style={styles.baslik}>
            <span style={styles.iconWrapper}>🩸</span> Kan Bağışı Yönetim Paneli
          </h1>
          <p style={styles.altBaslik}>Sistemdeki güncel stokları, talepleri ve bağışçıları yönetin.</p>
        </div>

        <div style={styles.kullaniciMenusu}>
          <button style={styles.profilButon} onClick={profiliYukle}>👤 Profilim</button>
          <button style={styles.cikisButon} onClick={cikisYap}>🚪 Çıkış Yap</button>
        </div>
      </header>

      {/* PROFIL MODALI */}
      {profilAcik && kullaniciBilgisi && (
        <div style={styles.modalArkaplan} onClick={() => setProfilAcik(false)}>
          <div style={styles.modalIcerik} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Profil Bilgileri</h2>
              <button style={styles.modalKapat} onClick={() => setProfilAcik(false)}>✖</button>
            </div>

            <div style={styles.profilDetay}>
              <div style={styles.profilAvatar}>
                {kullaniciBilgisi.fullName ? kullaniciBilgisi.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <h3 style={{ margin: "10px 0 5px 0" }}>{kullaniciBilgisi.fullName || "İsimsiz Kullanıcı"}</h3>
              <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{kullaniciBilgisi.email}</p>

              <div style={styles.profilSatir}>
                <strong>Kullanıcı Rolü:</strong>
                <span style={styles.rolBadge}>{kullaniciBilgisi.role || "Standart Personel"}</span>
              </div>
              <div style={styles.profilSatir}>
                <strong>Kullanıcı ID:</strong> #{kullaniciBilgisi.id}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={styles.bilgiMesaji}>⏳ Veriler sunucudan yükleniyor, lütfen bekleyin...</div>
      )}

      {/* ÜST İSTATİSTİK KARTLARI */}
      <div style={styles.analizGrid}>
        <div style={{ ...styles.analizKart, borderTop: "4px solid #3b82f6" }}>
          <span style={styles.kartIkon}>📋</span>
          <h4 style={styles.kartBaslik}>Toplam Talep</h4>
          <p style={styles.kartDeger}>{istatistik?.totalRequestCount || talepler.length || 0}</p>
        </div>
        <div style={{ ...styles.analizKart, borderTop: "4px solid #f59e0b" }}>
          <span style={styles.kartIkon}>⏳</span>
          <h4 style={styles.kartBaslik}>Bekleyen Talep</h4>
          <p style={{ ...styles.kartDeger, color: "#d97706" }}>{istatistik?.pendingRequestCount || 0}</p>
        </div>
        <div style={{ ...styles.analizKart, borderTop: "4px solid #10b981" }}>
          <span style={styles.kartIkon}>💉</span>
          <h4 style={styles.kartBaslik}>Toplam Stok</h4>
          <p style={{ ...styles.kartDeger, color: "#059669" }}>
            {istatistik?.totalStockUnit || kanStoklari.reduce((toplam, stok) => toplam + Number(stok.miktar || 0), 0)}{" "}
            <span style={{ fontSize: "1rem", color: "#6b7280" }}>Ünite</span>
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* SON TALEPLER */}
        <div style={styles.kart}>
          <h3 style={styles.kartAnaBaslik}>📋 Son Talepler</h3>
          <div style={styles.scrollArea}>
            {talepler.length === 0 ? (
              <p style={styles.bosDurum}>Henüz talep bulunamadı.</p>
            ) : (
              talepler.map((t) => {
                const kan = kanGrubuAl(t);
                const isSelected = selectedKan === kan;
                const talepId = t.id || t.Id;

                return (
                  <div
                    key={talepId}
                    onClick={() => {
                      if (selectedTalepId === talepId) {
                        setSelectedTalepId(null);
                        setNotificationDonors([]);
                      } else {
                        setSelectedTalepId(talepId);
                        talepBildirimleriniYukle(talepId);
                      }
                      setSelectedKan(kan);
                    }}
                    //setSelectedKan(kan)}
                    style={{
                      ...styles.talepKart,
                      borderColor: isSelected ? "#ef4444" : "#e5e7eb",
                      backgroundColor: isSelected ? "#fef2f2" : "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "1.1rem", color: "#111827", flex: 1 }}>
                        {t.hospitalName || t.HospitalName || t.requesterName || t.RequesterName || "Hastane Bilgisi Yok"}
                      </strong>
                      <span style={styles.badge}>{kan}</span>
                    </div>
                    <p style={{ margin: "4px 0", color: "#4b5563", fontSize: "0.9rem" }}>
                      🚨 Aciliyet: <strong>{aciliyetAl(t)}</strong>
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        Durum: <b style={{ color: "#374151" }}>{durumAl(t)}</b>
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={(e) => talepDuzenle(t, e)} style={styles.iconBtn}>✏️</button>
                        <button onClick={(e) => talepSil(talepId, e)} style={{ ...styles.iconBtn, color: "red" }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KAN STOKLARI */}
        <div style={styles.kart}>
          <h3 style={styles.kartAnaBaslik}>🩸 Kan Stokları</h3>
          <div style={styles.stokContainer}>
            {kanStoklari.map((k, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ color: "#374151" }}>{k.grup}</strong>
                  <span style={{ fontWeight: "600", color: stokRengi(Number(k.miktar || 0)) }}>{k.miktar} ünite</span>
                </div>
                <div style={styles.barArka}>
                  <div style={{ ...styles.barDolgu, width: `${Math.min((Number(k.miktar || 0) / 10) * 100, 100)}%`, backgroundColor: stokRengi(Number(k.miktar || 0)) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TALEP OLUŞTUR / DÜZENLE */}
        <div style={{ ...styles.kart, border: editingTalepId ? "2px solid #3b82f6" : "none" }}>
          <h3 style={styles.kartAnaBaslik}>
            {editingTalepId ? "✏️ Talebi Güncelle" : "➕ Yeni Talep Oluştur"}
          </h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>🏥 İşlem Yapan Hastane</label>
            <input
              style={{ ...styles.input, backgroundColor: "#f3f4f6", color: "#6b7280" }}
              value={hastaneBilgisi?.HospitalName || "Yükleniyor..."}
              disabled
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>🩸 Kan Grubu</label>
            <select style={styles.input} value={kanGrubu} onChange={(e) => setKanGrubu(e.target.value)} disabled={isSubmitting}>
              <option value="">Seçiniz</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>🚨 Aciliyet Durumu</label>
            <select style={styles.input} value={sartlar} onChange={(e) => setSartlar(e.target.value)} disabled={isSubmitting}>
              <option value="">Seçiniz</option>
              <option value="Acil">Acil</option>
              <option value="Kritik">Kritik</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <button
            style={{
              ...styles.buton,
              backgroundColor: isSubmitting ? "#9ca3af" : (editingTalepId ? "#3b82f6" : "#ef4444"),
              cursor: isSubmitting ? "not-allowed" : "pointer"
            }}
            onClick={talepKaydet}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sisteme İşleniyor... ⏳" : (editingTalepId ? "Değişiklikleri Kaydet" : "Talebi Sisteme İşle")}
          </button>

          {editingTalepId && !isSubmitting && (
            <button style={styles.iptalButon} onClick={formuTemizle}>İptal Et</button>
          )}
        </div>
      </div>

      {/* ALT BÖLÜM: BAĞIŞÇILAR */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={styles.kartAnaBaslik}>
          {selectedTalepId ? `🎯 Bu Talep İçin Bildirim Giden Bağışçılar` : "👥 Genel Bağışçı Listesi"}
        </h3>

        <div style={styles.donorScroll}>
          {/* Liste boşsa uyarı ver, doluysa map et */}
          {(selectedTalepId ? notifiedDonors : donors).length === 0 ? (
            <p style={styles.bosDurum}>Gösterilecek bağışçı bulunamadı.</p>
          ) : (
            (selectedTalepId ? notifiedDonors : donors).map((d, index) => {
              // İsim eşleşmesini hem küçük hem büyük harf için kontrol ediyoruz
              const adSoyad = d.FullName || d.fullName || d.Title || d.title || "İsimsiz";
              const yanit = d.ResponseStatus || d.responseStatus || "Pending";
              const kanGrup = d.BloodType || d.bloodType || "-";

              // Konsoldaki 'unique key' hatasını önlemek için benzersiz bir ID oluşturuyoruz
              const benzersizKey = d.UserNotificationId || d.userNotificationId || d.DonorId || d.donorId || d.id || index;

              return (
                <div key={benzersizKey} style={styles.donorKart}>
                  <div style={styles.donorAvatar}>
                    {adSoyad.charAt(0).toUpperCase()}
                  </div>
                  <h4 style={{ margin: "10px 0 5px 0", color: "#111827", fontSize: "1.1rem" }}>{adSoyad}</h4>

                  {/* Sadece talep seçiliyse yanıt durumunu göster */}
                  {selectedTalepId && (
                    <>
                      <div style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        marginTop: "5px",
                        backgroundColor: yanit === "Accepted" ? "#dcfce7" : yanit === "Rejected" ? "#fee2e2" : "#f3f4f6",
                        color: yanit === "Accepted" ? "#166534" : yanit === "Rejected" ? "#991b1b" : "#374151"
                      }}>
                        Durum: {yanit === "Accepted" ? "✅ Gelecek" : yanit === "Rejected" ? "❌ Gelemiyor" : "⏳ Yanıt Bekleniyor"}
                      </div>

                      {/* EĞER BAĞIŞÇI GELECEĞİM DEMİŞSE BUTONU GÖSTER */}
                      {yanit === "Accepted" && (
                        <button
                          onClick={() => bagisTamamla(d.DonorId || d.donorId, selectedTalepId)}
                          style={{
                            marginTop: "10px",
                            width: "100%",
                            padding: "8px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.8rem"
                          }}
                        >
                          ✅ Bağışı Tamamla
                        </button>
                      )}
                    </>
                  )}

                  <div style={styles.donorAltBilgi}>
                    {selectedTalepId
                      ? `📅 Bildirim: ${new Date(d.SentDate || d.sentDate).toLocaleDateString()}`
                      : `🗓 Son Bağış: ${d.LastDonationDate || d.lastDonationDate ? new Date(d.LastDonationDate || d.lastDonationDate).toLocaleDateString() : "Yok"}`
                    }
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "40px 5%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: "#1f2937" },
  header: { marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" },
  baslik: { color: "#111827", fontSize: "2.2rem", fontWeight: "800", margin: "0 0 10px 0", display: "flex", alignItems: "center" },
  iconWrapper: { marginRight: "12px", fontSize: "2.5rem" },
  altBaslik: { color: "#6b7280", fontSize: "1.1rem", margin: 0 },
  kullaniciMenusu: { display: "flex", gap: "10px" },
  profilButon: { padding: "10px 15px", backgroundColor: "#ffffff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: "600", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "background 0.2s" },
  cikisButon: { padding: "10px 15px", backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "background 0.2s" },
  modalArkaplan: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalIcerik: { backgroundColor: "#fff", padding: "24px", borderRadius: "16px", width: "90%", maxWidth: "400px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "15px", marginBottom: "20px" },
  modalKapat: { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" },
  profilDetay: { display: "flex", flexDirection: "column", alignItems: "center" },
  profilAvatar: { width: "80px", height: "80px", backgroundColor: "#3b82f6", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold" },
  profilSatir: { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.95rem" },
  rolBadge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" },
  bilgiMesaji: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "16px", borderRadius: "8px", marginBottom: "24px", fontWeight: "500", border: "1px solid #bfdbfe" },
  analizGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" },
  analizKart: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", transition: "transform 0.2s" },
  kartIkon: { fontSize: "2rem", marginBottom: "10px", display: "block" },
  kartBaslik: { margin: "0 0 10px 0", color: "#6b7280", fontSize: "1rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" },
  kartDeger: { margin: 0, fontSize: "2.5rem", fontWeight: "bold", color: "#111827" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" },
  kart: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" },
  kartAnaBaslik: { margin: "0 0 20px 0", color: "#1f2937", fontSize: "1.25rem", borderBottom: "2px solid #f3f4f6", paddingBottom: "10px" },
  scrollArea: { maxHeight: "400px", overflowY: "auto", paddingRight: "5px" },
  bosDurum: { color: "#9ca3af", fontStyle: "italic", textAlign: "center", padding: "20px 0" },
  talepKart: { marginBottom: "12px", padding: "16px", borderRadius: "12px", border: "2px solid", cursor: "pointer", transition: "all 0.2s ease-in-out" },
  badge: { backgroundColor: "#fee2e2", color: "#ef4444", padding: "4px 10px", borderRadius: "9999px", fontWeight: "bold", fontSize: "0.85rem" },
  stokContainer: { display: "flex", flexDirection: "column", gap: "8px" },
  barArka: { width: "100%", height: "12px", backgroundColor: "#f3f4f6", borderRadius: "9999px", overflow: "hidden" },
  barDolgu: { height: "100%", borderRadius: "9999px", transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151", fontSize: "0.95rem" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", boxSizing: "border-box", backgroundColor: "#f9fafb", color: "#1f2937", outline: "none" },
  buton: { width: "100%", padding: "14px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", marginTop: "10px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", transition: "background-color 0.2s" },
  iptalButon: { width: "100%", padding: "10px", backgroundColor: "transparent", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "10px" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "4px", borderRadius: "4px", transition: "background 0.2s" },
  filtreMesaji: { backgroundColor: "#fff7ed", color: "#c2410c", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", borderLeft: "4px solid #ea580c", fontSize: "0.95rem" },
  donorScroll: { display: "flex", overflowX: "auto", gap: "20px", paddingBottom: "20px", scrollbarWidth: "thin" },
  donorKart: { minWidth: "240px", backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  donorAvatar: { width: "60px", height: "60px", backgroundColor: "#fee2e2", color: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "10px" },
  donorAltBilgi: { marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #f3f4f6", width: "100%", fontSize: "0.85rem", color: "#6b7280" }
};

export default Dashboard;