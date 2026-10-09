/* =========================================================
   BRASA GRILL — GESTÃO DE PEDIDOS (Firebase Firestore)
   ========================================================= */

const db = firebase.firestore();

/* Guardar um novo pedido */
async function criarPedido(dados) {

    const pedido = {
        // Dados do cliente
        nome: dados.nome,
        telemovel: dados.telemovel,
        email: dados.email || "",
        morada: dados.morada || "",
        observacoes: dados.observacoes || "",

        // Produtos e totais
        produtos: dados.produtos,
        total: dados.total,
        quantidade: dados.quantidade,

        // Estado do pedido
        estado: "novo",        // novo → aceite → em_preparacao → pronto → entregue
        origem: "site",        // site | whatsapp

        // Data
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const ref = await db.collection("pedidos").add(pedido);
        console.log("✅ Pedido criado:", ref.id);
        return ref.id;
    } catch (e) {
        console.error("❌ Erro ao criar pedido:", e);
        throw e;
    }

}


/* Escutar pedidos em tempo real (usado no painel) */
function escutarPedidos(callback) {

    return db.collection("pedidos")
        .orderBy("criadoEm", "desc")
        .limit(50)
        .onSnapshot(snapshot => {

            const pedidos = [];

            snapshot.forEach(doc => {
                pedidos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            callback(pedidos);

        }, erro => {
            console.error("❌ Erro ao escutar pedidos:", erro);
        });

}


/* Atualizar o estado de um pedido */
async function atualizarEstadoPedido(id, novoEstado) {

    try {
        await db.collection("pedidos").doc(id).update({
            estado: novoEstado,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Pedido ${id} → ${novoEstado}`);
    } catch (e) {
        console.error("❌ Erro ao atualizar pedido:", e);
        throw e;
    }

}


/* Apagar um pedido */
async function apagarPedido(id) {

    try {
        await db.collection("pedidos").doc(id).delete();
        console.log(`🗑️ Pedido ${id} apagado`);
    } catch (e) {
        console.error("❌ Erro ao apagar pedido:", e);
        throw e;
    }

}


/* Formatar data do Firebase */
function formatarData(timestamp) {

    if (!timestamp) return "—";

    const data = timestamp.toDate();

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;

}


/* Som de notificação gerado por código */
function tocarNotificacao() {

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const notas = [
            { freq: 880, inicio: 0.00, duracao: 0.15 },
            { freq: 1174, inicio: 0.15, duracao: 0.20 },
            { freq: 1568, inicio: 0.35, duracao: 0.30 }
        ];

        notas.forEach(nota => {

            const oscilador = audioCtx.createOscillator();
            const ganho = audioCtx.createGain();

            oscilador.connect(ganho);
            ganho.connect(audioCtx.destination);

            oscilador.frequency.value = nota.freq;
            oscilador.type = "sine";

            ganho.gain.setValueAtTime(0, audioCtx.currentTime + nota.inicio);
            ganho.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + nota.inicio + 0.02);
            ganho.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + nota.inicio + nota.duracao);

            oscilador.start(audioCtx.currentTime + nota.inicio);
            oscilador.stop(audioCtx.currentTime + nota.inicio + nota.duracao);

        });

    } catch (e) {
        console.warn("Não foi possível tocar som:", e);
    }

}