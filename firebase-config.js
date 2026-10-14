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

async function obterRole(user) {
    if (!user) return null;
    try {
        const doc = await db.collection("roles").doc(user.uid).get();
        return doc.exists ? doc.data().role : null;
    } catch (e) {
        console.error("Erro ao obter role:", e);
        return null;
    }
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