import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

const API_URL = "http://localhost:5245";

function Login() {
    const [email, setEmail] = useState("");
    const [sifre, setSifre] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const girisYap = async () => {
        const toastId = "login-status";
        if (!email.trim() || !sifre.trim()) {
            toast.error("Lütfen tüm alanları doldurun.", { id: toastId });
            return;
        }

        setLoading(true);
        toast.loading("Giriş yapılıyor...", { id: toastId });

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: sifre })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Giriş Başarılı! Hoş geldiniz.", { id: toastId });
                localStorage.setItem("kullanici", JSON.stringify(data));
                const finalToken = data?.token || data?.data?.token || data?.Token;
                if (finalToken) localStorage.setItem("token", finalToken);

                setTimeout(() => {
                    toast.dismiss(toastId);
                    navigate("/dashboard");
                }, 1000);
            } else {
                toast.error(data?.message || "Giriş başarısız.", { id: toastId });
            }
        } catch (err) {
            toast.error("Sunucu bağlantısı kurulamadı.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.fullPageBackground}>
            {/* Sayfada sadece bir tane Toaster kalsın, Login içindekini silebilirsin demiştim ama buraya id'li bıraktım */}
            <Toaster position="top-right" />

            <div style={styles.overlay}></div>

            <div style={styles.loginContainer}>
                <div style={styles.glassCard}>
                    <div style={styles.logoArea}>
                        <span style={{ fontSize: "50px" }}>🩸</span>
                        <h2 style={styles.title}>Kan Merkezi Paneli</h2>
                        <p style={styles.subtitle}>Güvenli Giriş Sistemi</p>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Kurumsal E-Posta</label>
                        <input
                            type="email"
                            placeholder="eposta@hastane.com"
                            style={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Şifre</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={styles.input}
                            value={sifre}
                            onChange={(e) => setSifre(e.target.value)}
                        />
                    </div>

                    <button
                        style={{
                            ...styles.button,
                            backgroundColor: loading ? "#9ca3af" : "#d32f2f"
                        }}
                        onClick={girisYap}
                        disabled={loading}
                    >
                        {loading ? "Bağlanıyor..." : "Giriş Yap"}
                    </button>

                    <div style={styles.footer}>
                        <p>© 2026 Tüm Hakları Saklıdır.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    fullPageBackground: {
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Arka plan görseli burada:
        backgroundImage: "url('https://images.unsplash.com/photo-1579152276503-0974ec78309a?q=80&w=2000&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    overlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)", // Görseli biraz karartarak formu öne çıkarır
        zIndex: 1
    },
    loginContainer: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "20px"
    },
    glassCard: {
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        background: "rgba(255, 255, 255, 0.9)", // Şeffaf beyaz görünüm
        backdropFilter: "blur(10px)", // Arkayı bulanıklaştırma (Cam efekti)
        borderRadius: "20px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
        textAlign: "center"
    },
    logoArea: { marginBottom: "30px" },
    title: { fontSize: "24px", fontWeight: "bold", color: "#333", margin: "10px 0 5px 0" },
    subtitle: { color: "#666", fontSize: "14px" },
    inputGroup: { textAlign: "left", marginBottom: "20px" },
    label: { display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#444" },
    input: {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #ddd",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box"
    },
    button: {
        width: "100%",
        padding: "14px",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "0.3s"
    },
    footer: { marginTop: "25px", fontSize: "11px", color: "#888" }
};

export default Login;