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

/* ============================================================
   SECONDARY APP — criar contas sem perder sessão admin
   ============================================================ */

let _secondaryAuth = null;

function obterSecondaryAuth() {
    if (_secondaryAuth) return _secondaryAuth;

    let app;
    try {
        app = firebase.app("Secondary");
    } catch (e) {
        app = firebase.initializeApp(firebaseConfig, "Secondary");
    }

    _secondaryAuth = app.auth();
    _secondaryAuth.setPersistence(firebase.auth.Auth.Persistence.NONE)
        .catch(e => console.warn(e));

    return _secondaryAuth;
}

async function criarContaUtilizador(email, password) {
    const auth = obterSecondaryAuth();
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    await auth.signOut();
    return uid;
}

/* ============================================================
   GERADORES AUTOMÁTICOS
   ============================================================ */

function gerarSlug(nome) {
    const primeiro = (nome || "").trim().split(/\s+/)[0];
    return primeiro
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 15) || "user";
}

function gerarEmailDoNome(nome) {
    return `${gerarSlug(nome)}@brasagrill.mz`;
}

function gerarPasswordDoNome(nome) {
    const slug = gerarSlug(nome);
    const n = Math.floor(Math.random() * 90) + 10;
    return `${slug}${n}`;
}

/* ============================================================
   DETEÇÃO DE ROLE via coleção roles/{uid}
   ============================================================ */

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

/* ============================================================
   AUTENTICAÇÃO ANÓNIMA (cliente)
   ============================================================ */

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