import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5245";

function Login() {
    const [email, setEmail] = useState("");
    const [sifre, setSifre] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const girisYap = async () => {
        if (!email.trim() || !sifre.trim()) {
            alert("Email ve şifre boş bırakılamaz.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: sifre
                })
            });

            const contentType = response.headers.get("content-type");

            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (response.ok) {
                alert("Giriş başarılı ✅");

                localStorage.setItem("kullanici", JSON.stringify(data));

                // Backend'den gelen yapıya göre kontrol et:
                const finalToken = data?.token || data?.data?.token || data?.Token || data?.accessToken || data?.data?.accessToken;

                if (finalToken) {
                    localStorage.setItem("token", finalToken);
                    console.log("Token Kaydedildi:", finalToken); // Konsolda kontrol et

                } else {
                    console.error("Token verinin içinde bulunamadı!", data);
                }

                navigate("/dashboard");
            } else {
                const hataMesaji =
                    data?.message ||
                    data?.mesaj ||
                    data ||
                    "Giriş başarısız. Email veya şifre hatalı.";

                alert(hataMesaji);
            }
        } catch (err) {
            console.log(err);
            alert("Sunucuya bağlanamadı ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={arka}>
            <div style={kart}>
                <h2 style={{ textAlign: "center" }}>Hastane Girişi (Web)</h2>

                <input
                    type="email"
                    placeholder="Kurumsal Email"
                    style={input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Şifre"
                    style={input}
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                />

                <button
                    style={{
                        ...buton,
                        opacity: loading ? 0.6 : 1,
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                    onClick={girisYap}
                    disabled={loading}
                >
                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>

                <p style={{ marginTop: "10px", textAlign: "center", color: "#888" }}>
                    Sadece yetkili sağlık personeli
                </p>
            </div>
        </div>
    );
}

const arka = {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #d32f2f, #f5f5f5)"
};

const kart = {
    width: "350px",
    padding: "30px",
    background: "white",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
};

const input = {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none"
};

const buton = {
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    background: "#d32f2f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold"
};

export default Login;