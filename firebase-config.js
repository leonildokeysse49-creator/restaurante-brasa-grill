/* =========================================================
   BRASA GRILL — CONFIGURAÇÃO FIREBASE
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBc150AudMs3XrpQRNG2V3VvaE7-p3YJMY",
    authDomain: "brasa-grill-a22ee.firebaseapp.com",
    projectId: "brasa-grill-a22ee",
    storageBucket: "brasa-grill-a22ee.firebasestorage.app",
    messagingSenderId: "704336994465",
    appId: "1:704336994465:web:995467789ff219033450e0",
    measurementId: "G-DHFTB0YGGY"
};

// Inicializar Firebase (versão modular via CDN)
if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase inicializado:", firebaseConfig.projectId);
}