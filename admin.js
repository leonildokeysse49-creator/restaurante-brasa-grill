/* =========================================================
   BRASA GRILL — PAINEL DO RESTAURANTE
   ========================================================= */


/* =========================================================
   1. CONFIGURAÇÕES
   ========================================================= */

// ⚠️ MUDA ESTA PALAVRA-PASSE PARA A TUA
const ADMIN_PASSWORD = "brasa2026";

// Chave onde a sessão fica guardada
const SESSION_KEY = "brasaGrillAdmin";


/* =========================================================
   2. ESTADO
   ========================================================= */

let pedidosAtuais = [];
let filtroAtual = "todos";
let idsAnteriores = new Set();
let primeiraCarga = true;


/* =========================================================
   3. ELEMENTOS
   ========================================================= */

const ecraLogin = document.querySelector("#ecraLogin");
const painel = document.querySelector("#painel");
const formLogin = document.querySelector("#formLogin");
const passwordInput = document.querySelector("#passwordInput");
const erroLogin = document.querySelector("#erroLogin");
const btnSair = document.querySelector("#btnSair");
const listaPedidos = document.querySelector("#listaPedidos");
const indicadorLigacao = document.querySelector("#indicadorLigacao");
const btnFiltros = document.querySelectorAll(".btn-filtro");
const estatCards = document.querySelectorAll(".estat-card");


/* =========================================================
   4. LOGIN / LOGOUT
   ========================================================= */

function verificarLogin() {

    const logado = sessionStorage.getItem(SESSION_KEY);

    if (logado === "sim") {
        mostrarPainel();
    } else {
        mostrarLogin();
    }

}


function mostrarLogin() {

    ecraLogin.hidden = false;
    painel.hidden = true;

    passwordInput.focus();
    recriarIcones();

}


function mostrarPainel() {

    ecraLogin.hidden = true;
    painel.hidden = false;

    iniciarPainel();
    recriarIcones();

}


formLogin.addEventListener("submit", function (e) {

    e.preventDefault();

    const pass = passwordInput.value;

    if (pass === ADMIN_PASSWORD) {

        sessionStorage.setItem(SESSION_KEY, "sim");
        erroLogin.hidden = true;
        passwordInput.value = "";
        mostrarPainel();

    } else {

        erroLogin.hidden = false;
        passwordInput.value = "";
        passwordInput.focus();

    }

});


btnSair.addEventListener("click", function () {

    sessionStorage.removeItem(SESSION_KEY);
    mostrarLogin();

});


/* =========================================================
   5. INICIAR PAINEL
   ========================================================= */

function iniciarPainel() {

    // Escutar pedidos em tempo real
    db.collection("pedidos")
        .orderBy("criadoEm", "desc")
        .limit(100)
        .onSnapshot(snapshot => {

            // Ligação ok
            indicadorLigacao.innerHTML = '<i data-lucide="wifi"></i> Em direto';
            indicadorLigacao.classList.remove("offline");

            const novos = [];

            snapshot.forEach(doc => {
                novos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Verificar se há pedidos novos
            if (!primeiraCarga) {

                const idsAtuais = new Set(novos.map(p => p.id));

                novos.forEach(pedido => {

                    if (!idsAnteriores.has(pedido.id) && pedido.estado === "novo") {
                        tocarNotificacao();
                        console.log("🔔 Novo pedido:", pedido.nome);
                    }

                });

            }

            // Atualizar estado
            idsAnteriores = new Set(novos.map(p => p.id));
            pedidosAtuais = novos;
            primeiraCarga = false;

            // Renderizar
            renderizarEstatisticas();
            renderizarPedidos();

        }, erro => {

            console.error("❌ Erro na ligação ao Firestore:", erro);

            indicadorLigacao.innerHTML = '<i data-lucide="wifi-off"></i> Sem ligação';
            indicadorLigacao.classList.add("offline");

        });

}


/* =========================================================
   6. ESTATÍSTICAS
   ========================================================= */

function renderizarEstatisticas() {

    const cont = {
        novo: 0,
        aceite: 0,
        em_preparacao: 0,
        pronto: 0,
        entregue: 0
    };

    pedidosAtuais.forEach(p => {
        if (cont[p.estado] !== undefined) {
            cont[p.estado]++;
        }
    });

    document.querySelector("#contNovo").textContent = cont.novo;
    document.querySelector("#contAceite").textContent = cont.aceite;
    document.querySelector("#contPreparacao").textContent = cont.em_preparacao;
    document.querySelector("#contPronto").textContent = cont.pronto;
    document.querySelector("#contEntregue").textContent = cont.entregue;

}


/* =========================================================
   7. RENDERIZAR PEDIDOS
   ========================================================= */

function renderizarPedidos() {

    let pedidosFiltrados = pedidosAtuais;

    if (filtroAtual !== "todos") {
        pedidosFiltrados = pedidosAtuais.filter(p => p.estado === filtroAtual);
    }

    if (pedidosFiltrados.length === 0) {

        listaPedidos.innerHTML = `
            <div class="sem-pedidos">
                <i data-lucide="inbox"></i>
                <p>Nenhum pedido ${filtroAtual !== "todos" ? `no estado "${filtroAtual}"` : ""} de momento.</p>
            </div>
        `;

        recriarIcones();
        return;

    }

    listaPedidos.innerHTML = pedidosFiltrados.map(pedido => {

        const data = formatarData(pedido.criadoEm);
        const estadoTexto = {
            novo: "🆕 Novo",
            aceite: "✅ Aceite",
            em_preparacao: "👨‍🍳 Em preparação",
            pronto: "📦 Pronto",
            entregue: "✔️ Entregue",
            recusado: "❌ Recusado"
        }[pedido.estado] || pedido.estado;

        const produtosHTML = (pedido.produtos || []).map(p => `
            <li>
                <span>${p.quantidade}× ${p.nome}</span>
                <span>${formatarPreco(p.subtotal)}</span>
            </li>
        `).join("");

        return `
            <article class="pedido estado-${pedido.estado}" data-id="${pedido.id}">

                <div class="pedido-topo">
                    <h3>
                        ${pedido.nome}
                        <small>${data}</small>
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

                    ${pedido.email ? `
                        <div>
                            <span>Email:</span>
                            <span>${pedido.email}</span>
                        </div>
                    ` : ""}

                    ${pedido.morada ? `
                        <div>
                            <span>Morada:</span>
                            <span>${pedido.morada}</span>
                        </div>
                    ` : ""}

                </div>

                <div class="pedido-produtos">
                    <strong>Produtos</strong>
                    <ul>${produtosHTML}</ul>
                </div>

                ${pedido.observacoes ? `
                    <div class="pedido-produtos">
                        <strong>Observações</strong>
                        <p style="color:var(--texto); margin-top:4px;">
                            ${pedido.observacoes}
                        </p>
                    </div>
                ` : ""}

                <div class="pedido-total">
                    <span>TOTAL</span>
                    <span>${formatarPreco(pedido.total)}</span>
                </div>

                <div class="pedido-acoes">

                    ${pedido.estado === "novo" ? `
                        <button class="btn-acao btn-aceitar" data-acao="aceite" data-id="${pedido.id}">
                            <i data-lucide="check"></i> Aceitar
                        </button>
                        <button class="btn-acao btn-recusar" data-acao="recusado" data-id="${pedido.id}">
                            <i data-lucide="x"></i> Recusar
                        </button>
                    ` : ""}

                    ${pedido.estado === "aceite" ? `
                        <button class="btn-acao btn-preparar" data-acao="em_preparacao" data-id="${pedido.id}">
                            <i data-lucide="chef-hat"></i> Preparar
                        </button>
                    ` : ""}

                    ${pedido.estado === "em_preparacao" ? `
                        <button class="btn-acao btn-pronto" data-acao="pronto" data-id="${pedido.id}">
                            <i data-lucide="package"></i> Pronto
                        </button>
                    ` : ""}

                    ${pedido.estado === "pronto" ? `
                        <button class="btn-acao btn-entregar" data-acao="entregue" data-id="${pedido.id}">
                            <i data-lucide="check-check"></i> Entregue
                        </button>
                    ` : ""}

                    ${pedido.estado === "entregue" || pedido.estado === "recusado" ? `
                        <button class="btn-acao btn-apagar" data-acao="apagar" data-id="${pedido.id}">
                            <i data-lucide="trash-2"></i> Apagar
                        </button>
                    ` : ""}

                </div>

            </article>
        `;

    }).join("");

    recriarIcones();

}


/* =========================================================
   8. AÇÕES NOS PEDIDOS
   ========================================================= */

listaPedidos.addEventListener("click", async function (e) {

    const btn = e.target.closest("[data-acao]");
    if (!btn) return;

    const id = btn.dataset.id;
    const acao = btn.dataset.acao;

    try {

        if (acao === "apagar") {

            if (!confirm("Tens a certeza que queres apagar este pedido?")) return;
            await apagarPedido(id);

        } else {

            await atualizarEstadoPedido(id, acao);

        }

    } catch (e) {

        console.error("Erro:", e);
        alert("❌ Não foi possível atualizar o pedido.");

    }

});


/* =========================================================
   9. FILTROS
   ========================================================= */

btnFiltros.forEach(btn => {

    btn.addEventListener("click", function () {

        filtroAtual = this.dataset.filtro;

        btnFiltros.forEach(b => b.classList.remove("ativo"));
        this.classList.add("ativo");

        renderizarPedidos();

    });

});


estatCards.forEach(card => {

    card.addEventListener("click", function () {

        filtroAtual = this.dataset.filtro;

        btnFiltros.forEach(b => b.classList.remove("ativo"));

        const btnCorrespondente = [...btnFiltros].find(
            b => b.dataset.filtro === filtroAtual
        );

        if (btnCorrespondente) btnCorrespondente.classList.add("ativo");

        renderizarPedidos();

    });

});


/* =========================================================
   10. INICIAR
   ========================================================= */

verificarLogin();

// Atualizar ícones após carregar
window.addEventListener("load", recriarIcones);