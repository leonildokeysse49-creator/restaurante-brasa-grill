/* =========================================================
   BRASA GRILL — PAINEL DO ESTAFETA
   ========================================================= */


/* =========================================================
   1. CONFIGURAÇÕES E ESTADO
   ========================================================= */

const SESSION_KEY = "brasaGrillEstafeta";
const VALOR_POR_ENTREGA = 60; // MT por entrega

let estafetaAtual = null;
let pedidosAtribuidos = [];
let unsubscribePedidos = null;


/* =========================================================
   2. ELEMENTOS DO HTML
   ========================================================= */

const ecraLogin = document.querySelector("#ecraLogin");
const painel = document.querySelector("#painel");
const formLogin = document.querySelector("#formLogin");
const telemovelInput = document.querySelector("#telemovelInput");
const passwordInput = document.querySelector("#passwordInput");
const erroLogin = document.querySelector("#erroLogin");
const nomeEstafeta = document.querySelector("#nomeEstafeta");
const estadoAtual = document.querySelector("#estadoAtual");
const btnEstado = document.querySelector("#btnEstado");
const btnSair = document.querySelector("#btnSair");
const listaPedidos = document.querySelector("#listaPedidos");
const totalEntregas = document.querySelector("#totalEntregas");
const ganhosHoje = document.querySelector("#ganhosHoje");
const indicadorLigacao = document.querySelector("#indicadorLigacao");


/* =========================================================
   3. FUNÇÕES AUXILIARES
   ========================================================= */

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-MZ").format(valor) + " MT";
}

function recriarIcones() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

function formatarData(timestamp) {
    if (!timestamp) return "—";
    try {
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const hora = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dia}/${mes} às ${hora}:${min}`;
    } catch (e) {
        return "—";
    }
}


/* =========================================================
   4. LOGIN
   ========================================================= */

if (formLogin) {

    formLogin.addEventListener("submit", async function (e) {

        e.preventDefault();

        const tel = telemovelInput.value.replace(/\D/g, "");
        const pass = passwordInput.value.trim();

        if (!tel || !pass) return;

        try {

            const snapshot = await db.collection("estafetas")
                .where("telemovel", "==", tel)
                .where("password", "==", pass)
                .where("ativo", "==", true)
                .get();

            if (snapshot.empty) {
                erroLogin.hidden = false;
                passwordInput.value = "";
                return;
            }

            const doc = snapshot.docs[0];
            estafetaAtual = { id: doc.id, ...doc.data() };

            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                id: estafetaAtual.id,
                nome: estafetaAtual.nome
            }));

            erroLogin.hidden = true;
            iniciarPainelEstafeta();

        } catch (erro) {

            console.error("Erro login:", erro);
            alert("❌ Erro ao ligar. Tente novamente.");

        }

    });

}


/* =========================================================
   5. INICIAR PAINEL
   ========================================================= */

function iniciarPainelEstafeta() {

    ecraLogin.hidden = true;
    painel.hidden = false;

    nomeEstafeta.textContent = estafetaAtual.nome;

    atualizarEstadoUI();
    escutarPedidos();
    recriarIcones();

}


/* =========================================================
   6. ESCUTAR PEDIDOS ATRIBUÍDOS
   ========================================================= */

function escutarPedidos() {

    if (unsubscribePedidos) unsubscribePedidos();

    unsubscribePedidos = db.collection("pedidos")
        .where("estafetaId", "==", estafetaAtual.id)
        .orderBy("criadoEm", "desc")
        .limit(30)
        .onSnapshot(snapshot => {

            indicadorLigacao.innerHTML = '<i data-lucide="wifi"></i> Em direto';
            indicadorLigacao.classList.remove("offline");

            pedidosAtribuidos = [];

            snapshot.forEach(doc => {
                pedidosAtribuidos.push({ id: doc.id, ...doc.data() });
            });

            renderizarPedidos();
            atualizarResumo();

        }, erro => {

            console.error("Erro Firestore:", erro);

            indicadorLigacao.innerHTML = '<i data-lucide="wifi-off"></i> Sem ligação';
            indicadorLigacao.classList.add("offline");

        });

}


/* =========================================================
   7. RESUMO DO DIA
   ========================================================= */

function atualizarResumo() {

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const entreguesHoje = pedidosAtribuidos.filter(p => {

        if (p.estado !== "entregue") return false;
        if (!p.entregueEm) return false;

        const data = p.entregueEm.toDate
            ? p.entregueEm.toDate()
            : new Date(p.entregueEm);

        return data >= inicioHoje;

    });

    totalEntregas.textContent = entreguesHoje.length;
    ganhosHoje.textContent = formatarPreco(entreguesHoje.length * VALOR_POR_ENTREGA);

}


/* =========================================================
   8. RENDERIZAR PEDIDOS
   ========================================================= */

function renderizarPedidos() {

    const ativos = pedidosAtribuidos.filter(p =>
        p.estado === "pronto" || p.estado === "a_caminho"
    );

    if (ativos.length === 0) {

        listaPedidos.innerHTML = `
            <div class="sem-pedidos">
                <i data-lucide="inbox"></i>
                <p>Nenhum pedido ativo.</p>
            </div>
        `;

        recriarIcones();
        return;

    }

    listaPedidos.innerHTML = ativos.map(pedido => {

        const produtosHTML = (pedido.produtos || []).map(p => `
            <li>
                <span>${p.quantidade}× ${p.nome}</span>
            </li>
        `).join("");

        const linkMapa = pedido.localizacao && pedido.localizacao.lat
            ? `https://www.google.com/maps?q=${pedido.localizacao.lat},${pedido.localizacao.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.morada || "")}`;

        const estadoTexto = pedido.estado === "pronto"
            ? "📦 Pronto"
            : "🛵 A caminho";

        return `
            <article class="pedido-estafeta estado-${pedido.estado}">

                <div class="pedido-topo">
                    <h3>
                        ${pedido.nome}
                        <small>${formatarData(pedido.criadoEm)}</small>
                    </h3>
                    <span class="pedido-estado ${pedido.estado}">${estadoTexto}</span>
                </div>

                <div class="pedido-info">

                    <div>
                        <span>Telemóvel:</span>
                        <span>
                            <a href="tel:${pedido.telemovel}" style="color:var(--amarelo);">
                                ${pedido.telemovel}
                            </a>
                        </span>
                    </div>

                    <div>
                        <span>Morada:</span>
                        <span>${pedido.morada || "—"}</span>
                    </div>

                    ${pedido.referencia ? `
                        <div>
                            <span>Referência:</span>
                            <span>${pedido.referencia}</span>
                        </div>
                    ` : ""}

                    <div>
                        <span>Total:</span>
                        <span>${formatarPreco(pedido.total)}</span>
                    </div>

                </div>

                <div class="pedido-produtos">
                    <strong>Produtos</strong>
                    <ul>${produtosHTML}</ul>
                </div>

                <div class="pedido-acoes">

                    <a href="${linkMapa}" target="_blank" class="btn-estafeta btn-mapa">
                        <i data-lucide="map-pin"></i> Ver no mapa
                    </a>

                    <a href="tel:${pedido.telemovel}" class="btn-estafeta btn-ligar">
                        <i data-lucide="phone"></i> Ligar
                    </a>

                    ${pedido.estado === "pronto" ? `
                        <button type="button" class="btn-estafeta btn-iniciar"
                                data-iniciar="${pedido.id}">
                            <i data-lucide="bike"></i> Iniciar entrega
                        </button>
                    ` : ""}

                    ${pedido.estado === "a_caminho" ? `
                        <button type="button" class="btn-estafeta btn-entregar"
                                data-entregar="${pedido.id}">
                            <i data-lucide="check-check"></i> Confirmar entrega
                        </button>
                    ` : ""}

                </div>

            </article>
        `;

    }).join("");

    recriarIcones();

}


/* =========================================================
   9. AÇÕES NOS PEDIDOS
   ========================================================= */

if (listaPedidos) {

    listaPedidos.addEventListener("click", async function (e) {

        // Botão "Iniciar entrega"
        const btnIniciar = e.target.closest("[data-iniciar]");

        if (btnIniciar) {

            try {

                await db.collection("pedidos").doc(btnIniciar.dataset.iniciar).update({
                    estado: "a_caminho",
                    iniciadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log("✅ Pedido marcado como a caminho");

            } catch (erro) {

                console.error("Erro:", erro);
                alert("❌ Não foi possível iniciar a entrega.");

            }

            return;

        }

        // Botão "Confirmar entrega"
        const btnEntregar = e.target.closest("[data-entregar]");

        if (btnEntregar) {

            if (!confirm("Confirmar que o pedido foi entregue?")) return;

            try {

                await db.collection("pedidos").doc(btnEntregar.dataset.entregar).update({
                    estado: "entregue",
                    entregueEm: firebase.firestore.FieldValue.serverTimestamp(),
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log("✅ Pedido marcado como entregue");

            } catch (erro) {

                console.error("Erro:", erro);
                alert("❌ Não foi possível confirmar a entrega.");

            }

        }

    });

}


/* =========================================================
   10. ESTADO ONLINE / OFFLINE
   ========================================================= */

function atualizarEstadoUI() {

    const estado = estafetaAtual.estado || "offline";

    estadoAtual.textContent = estado === "disponivel"
        ? "Online"
        : estado === "ocupado"
            ? "Ocupado"
            : "Offline";

    if (estado === "disponivel") {
        btnEstado.textContent = "Ficar offline";
        btnEstado.classList.add("online");
    } else {
        btnEstado.textContent = "Ficar online";
        btnEstado.classList.remove("online");
    }

}

if (btnEstado) {

    btnEstado.addEventListener("click", async function () {

        const estado = estafetaAtual.estado || "offline";
        const novoEstado = estado === "disponivel" ? "offline" : "disponivel";

        try {

            await db.collection("estafetas").doc(estafetaAtual.id).update({
                estado: novoEstado
            });

            estafetaAtual.estado = novoEstado;
            atualizarEstadoUI();

        } catch (erro) {

            console.error("Erro ao mudar estado:", erro);
            alert("❌ Não foi possível mudar o estado.");

        }

    });

}


/* =========================================================
   11. SAIR
   ========================================================= */

if (btnSair) {

    btnSair.addEventListener("click", async function () {

        if (!confirm("Quer sair?")) return;

        try {

            // Ficar offline ao sair
            await db.collection("estafetas").doc(estafetaAtual.id).update({
                estado: "offline"
            });

        } catch (e) {
            console.warn("Erro ao atualizar estado:", e);
        }

        if (unsubscribePedidos) unsubscribePedidos();

        sessionStorage.removeItem(SESSION_KEY);
        location.reload();

    });

}


/* =========================================================
   12. AUTO-LOGIN
   ========================================================= */

async function verificarSessao() {

    const stored = sessionStorage.getItem(SESSION_KEY);

    if (!stored) return;

    try {

        const dados = JSON.parse(stored);
        const doc = await db.collection("estafetas").doc(dados.id).get();

        if (!doc.exists) return;

        estafetaAtual = { id: doc.id, ...doc.data() };

        // Sempre offline ao entrar
        await db.collection("estafetas").doc(estafetaAtual.id).update({
            estado: "offline"
        });

        estafetaAtual.estado = "offline";

        iniciarPainelEstafeta();

    } catch (e) {

        console.warn("Sessão inválida:", e);
        sessionStorage.removeItem(SESSION_KEY);

    }

}


/* =========================================================
   13. INICIAR
   ========================================================= */

verificarSessao();
window.addEventListener("load", recriarIcones);