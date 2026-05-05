import { useEffect, useState } from "react";

const API_URL = "http://localhost:5245";

function RequestList() {
    const [talepler, setTalepler] = useState([]);

    useEffect(() => {
        const talepleriGetir = async () => {
            try {
                const res = await fetch(`${API_URL}/api/requests/getall`);

                if (!res.ok) {
                    throw new Error("Kan talepleri getirilemedi");
                }

                const data = await res.json();

                if (Array.isArray(data)) {
                    setTalepler(data);
                } else if (Array.isArray(data.data)) {
                    setTalepler(data.data);
                } else if (Array.isArray(data.Data)) {
                    setTalepler(data.Data);
                } else {
                    setTalepler([]);
                }
            } catch (err) {
                console.log(err);
                setTalepler([]);
            }
        };

        talepleriGetir();
    }, []);

    const getHastane = (t) => {
        return t.hastane || t.hospital || t.hospitalName || "Hastane bilgisi yok";
    };

    const getAdres = (t) => {
        return t.adres || t.address || "Adres bilgisi yok";
    };

    const getKanGrubu = (t) => {
        return t.bloodType || t.kanGrubu || t.kan || "-";
    };

    const getSartlar = (t) => {
        return t.urgency || t.sartlar || "Acil";
    };

    const getDurum = (t) => {
        return t.status || t.durum || "Beklemede";
    };

    const getTarih = (t) => {
        if (!t.createdDate && !t.tarih) return "-";

        const tarih = t.createdDate || t.tarih;

        try {
            return new Date(tarih).toLocaleDateString("tr-TR");
        } catch {
            return tarih;
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Kan Talepleri</h2>

            {talepler.length === 0 ? (
                <p>Kan talebi bulunamadı.</p>
            ) : (
                talepler.map((t, i) => (
                    <div key={i} style={kart}>
                        <p><b>Hastane:</b> {getHastane(t)}</p>
                        <p><b>Adres:</b> {getAdres(t)}</p>
                        <p><b>Kan Grubu:</b> {getKanGrubu(t)}</p>
                        <p><b>Şartlar / Aciliyet:</b> {getSartlar(t)}</p>
                        <p><b>Durum:</b> {getDurum(t)}</p>
                        <p><b>Oluşturulma Tarihi:</b> {getTarih(t)}</p>
                    </div>
                ))
            )}
        </div>
    );
}

const kart = {
    background: "white",
    padding: "15px",
    marginTop: "10px",
    borderRadius: "10px",
    boxShadow: "0 5px 10px rgba(0,0,0,0.1)"
};

export default RequestList;