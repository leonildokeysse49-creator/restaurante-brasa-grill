/* =========================================================
   BRASA GRILL — CONFIGURAÇÃO FIREBASE
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyA6c3TkaitCJN7HSjaHd_7E5Jy_qSAtqmw",
    authDomain: "brasa-grill-a22ee.firebaseapp.com",
    projectId: "brasa-grill-a22ee",
    storageBucket: "brasa-grill-a22ee.firebasestorage.app",
    messagingSenderId: "704336994465",
    appId: "1:704336994465:web:995467789ff219033450e0",
    measurementId: "G-DHFTB0YGGY"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase inicializado");
}

if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(e => console.warn("Persistência:", e));
}

/* Deteta o role baseado apenas no email autenticado */
function obterRolePorEmail(user) {
    if (!user || !user.email) return null;
    const email = user.email.toLowerCase();

    if (email === "admin@brasagrill.mz") return "admin";
    if (email.startsWith("garcom.") && email.endsWith("@brasagrill.mz")) return "garcom";
    if (email.startsWith("estafeta.") && email.endsWith("@brasagrill.mz")) return "estafeta";

    return null;
}

/* Mantém a assinatura antiga por compatibilidade */
async function obterRole(user) {
    return obterRolePorEmail(user);
}

async function garantirAutenticacao() {
    if (!firebase.auth().currentUser) {
        try {
            await firebase.auth().signInAnonymously();
            console.log("🔐 Sessão anónima ativa");
        } catch (e) {
            console.error("Erro auth anónima:", e);
        }
    }
}