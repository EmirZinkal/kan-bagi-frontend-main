import { useEffect, useState } from "react";

const API_URL = "http://localhost:5245";

function DonorList() {
    const [donorlar, setDonorlar] = useState([]);

    useEffect(() => {
        const donorGetir = async () => {
            try {
                const res = await fetch(`${API_URL}/api/donors/getlist`);

                if (!res.ok) {
                    throw new Error("Bağışçılar getirilemedi");
                }

                const data = await res.json();

                if (Array.isArray(data)) {
                    setDonorlar(data);
                } else if (Array.isArray(data.data)) {
                    setDonorlar(data.data);
                } else if (Array.isArray(data.Data)) {
                    setDonorlar(data.Data);
                } else {
                    setDonorlar([]);
                }
            } catch (err) {
                console.log(err);
                setDonorlar([]);
            }
        };

        donorGetir();
    }, []);

    const getDonorName = (d) => {
        if (d.ad) return d.ad;
        if (d.name) return d.name;
        if (d.fullName) return d.fullName;

        const firstName = d.firstName || "";
        const lastName = d.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();

        return fullName || `Bağışçı #${d.id || ""}`;
    };

    const getBloodType = (d) => {
        return d.bloodType || d.kan || d.kanGrubu || "-";
    };

    const getAge = (d) => {
        return d.age || d.yas || "-";
    };

    const getLastDonation = (d) => {
        return d.lastDonationDate || d.sonBagis || "-";
    };

    return (
        <div style={container}>
            <h2>Uygun Bağışçılar</h2>

            {donorlar.length === 0 ? (
                <p>Bağışçı bulunamadı.</p>
            ) : (
                donorlar.map((d, i) => (
                    <div key={i} style={kart}>
                        <p><b>Ad:</b> {getDonorName(d)}</p>
                        <p><b>Kan Grubu:</b> {getBloodType(d)}</p>
                        <p><b>Yaş:</b> {getAge(d)}</p>
                        <p><b>Son Bağış:</b> {getLastDonation(d)}</p>
                    </div>
                ))
            )}
        </div>
    );
}

const container = {
    padding: "20px"
};

const kart = {
    background: "white",
    padding: "15px",
    marginTop: "10px",
    borderRadius: "10px",
    boxShadow: "0 5px 10px rgba(0,0,0,0.1)"
};

export default DonorList;