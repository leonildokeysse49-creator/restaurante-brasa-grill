/* =========================================================
   BRASA GRILL — PAINEL DO RESTAURANTE
   ========================================================= */


/* =========================================================
   1. CONFIGURAÇÕES
   ========================================================= */

const ADMIN_PASSWORD = "brasa2026";
const ADMIN_NOME = "Leonildo";

const SESSION_KEY = "brasaGrillAdmin";
const SESSION_NOME = "brasaGrillNome";


/* =========================================================
   2. FUNÇÕES AUXILIARES
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

        const data = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");

        return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;

    } catch (e) {
        return "—";
    }

}


function saudacaoPorHora() {

    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12)  return "Bom dia";
    if (hora >= 12 && hora < 20) return "Boa tarde";
    return "Boa noite";

}


/* =========================================================
   3. ESTADO
   ========================================================= */

let pedidosAtuais = [];
let filtroAtual = "todos";
let periodoAtual = "hoje";
let tipoAtual = "todos";
let pesquisaAtual = "";
let idsAnteriores = new Set();
let primeiraCarga = true;


/* =========================================================
   4. ELEMENTOS
   ========================================================= */

const ecraLogin = document.querySelector("#ecraLogin");
const ecraBoasVindas = document.querySelector("#ecraBoasVindas");
const boasVindasNome = document.querySelector("#boasVindasNome");
const painel = document.querySelector("#painel");
const saudacaoPainel = document.querySelector("#saudacaoPainel");
const formLogin = document.querySelector("#formLogin");
const passwordInput = document.querySelector("#passwordInput");
const erroLogin = document.querySelector("#erroLogin");
const btnSair = document.querySelector("#btnSair");
const listaPedidos = document.querySelector("#listaPedidos");
const indicadorLigacao = document.querySelector("#indicadorLigacao");
const btnFiltros = document.querySelectorAll(".btn-filtro");
const estatCards = document.querySelectorAll(".estat-card");
const btnPeriodos = document.querySelectorAll(".btn-periodo");
const btnTipos = document.querySelectorAll(".btn-tipo");
const inputPesquisa = document.querySelector("#pesquisaPedidos");
const btnLimparPesquisa = document.querySelector("#limparPesquisa");


/* =========================================================
   5. LOGIN / LOGOUT
   ========================================================= */

function verificarLogin() {

    const logado = sessionStorage.getItem(SESSION_KEY);

    if (logado === "sim") {

        const nome = sessionStorage.getItem(SESSION_NOME) || ADMIN_NOME;

        ecraLogin.hidden = true;
        ecraBoasVindas.hidden = true;
        painel.hidden = false;

        if (saudacaoPainel) {
            saudacaoPainel.textContent =
                `${saudacaoPorHora()}, ${nome} — Pedidos em tempo real`;
        }

        iniciarPainel();
        recriarIcones();

    } else {

        mostrarLogin();

    }

}


function mostrarLogin() {

    ecraLogin.hidden = false;
    ecraBoasVindas.hidden = true;
    painel.hidden = true;

    if (passwordInput) passwordInput.focus();

    recriarIcones();

}


function mostrarBoasVindas(nome) {

    ecraLogin.hidden = true;
    painel.hidden = true;
    ecraBoasVindas.hidden = false;

    if (boasVindasNome) {
        boasVindasNome.textContent = nome;
    }

    recriarIcones();

}


function entrarNoPainel(nome) {

    ecraLogin.hidden = true;
    ecraBoasVindas.hidden = true;
    painel.hidden = false;

    if (saudacaoPainel) {
        saudacaoPainel.textContent =
            `${saudacaoPorHora()}, ${nome} — Pedidos em tempo real`;
    }

    iniciarPainel();
    recriarIcones();

}


if (formLogin) {

    formLogin.addEventListener("submit", function (e) {

        e.preventDefault();

        const pass = passwordInput.value;

        if (pass === ADMIN_PASSWORD) {

            sessionStorage.setItem(SESSION_KEY, "sim");
            sessionStorage.setItem(SESSION_NOME, ADMIN_NOME);

            erroLogin.hidden = true;
            passwordInput.value = "";

            mostrarBoasVindas(ADMIN_NOME);

            setTimeout(() => {
                entrarNoPainel(ADMIN_NOME);
            }, 2000);

        } else {

            erroLogin.hidden = false;
            passwordInput.value = "";
            passwordInput.focus();

        }

    });

}


if (btnSair) {

    btnSair.addEventListener("click", function () {

        if (!confirm("Quer mesmo sair do painel?")) return;

        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_NOME);

        primeiraCarga = true;
        idsAnteriores = new Set();
        pedidosAtuais = [];
        filtroAtual = "todos";
        periodoAtual = "hoje";
        tipoAtual = "todos";
        pesquisaAtual = "";

        mostrarLogin();

    });

}


/* =========================================================
   6. INICIAR PAINEL
   ========================================================= */

function iniciarPainel() {

    db.collection("pedidos")
        .orderBy("criadoEm", "desc")
        .limit(200)
        .onSnapshot(snapshot => {

            if (indicadorLigacao) {
                indicadorLigacao.innerHTML = '<i data-lucide="wifi"></i> Em direto';
                indicadorLigacao.classList.remove("offline");
            }

            const novos = [];

            snapshot.forEach(doc => {
                novos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            if (!primeiraCarga) {

                novos.forEach(pedido => {

                    if (!idsAnteriores.has(pedido.id) && pedido.estado === "novo") {
                        tocarNotificacao();
                        console.log("🔔 Novo pedido:", pedido.nome);
                    }

                });

            }

            idsAnteriores = new Set(novos.map(p => p.id));
            pedidosAtuais = novos;
            primeiraCarga = false;

            renderizarResumoDia();
            renderizarEstatisticas();
            renderizarPedidos();

        }, erro => {

            console.error("❌ Erro na ligação ao Firestore:", erro);

            if (indicadorLigacao) {
                indicadorLigacao.innerHTML = '<i data-lucide="wifi-off"></i> Sem ligação';
                indicadorLigacao.classList.add("offline");
            }

        });

}


/* =========================================================
   7. FILTRAR POR PERÍODO
   ========================================================= */

function filtrarPorPeriodo(pedidos, periodo) {

    if (periodo === "tudo") return pedidos;

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    return pedidos.filter(p => {

        if (!p.criadoEm) return false;

        const data = p.criadoEm.toDate ? p.criadoEm.toDate() : new Date(p.criadoEm);

        switch (periodo) {

            case "hoje":
                return data >= hoje;

            case "ontem": {
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                return data >= ontem && data < hoje;
            }

            case "7dias": {
                const seteDias = new Date(hoje);
                seteDias.setDate(seteDias.getDate() - 7);
                return data >= seteDias;
            }

            case "mes": {
                const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
                return data >= inicioMes;
            }

            default:
                return true;

        }

    });

}


/* =========================================================
   8. FILTRAR POR TIPO
   ========================================================= */

function filtrarPorTipo(pedidos, tipo) {

    if (tipo === "todos") return pedidos;

    return pedidos.filter(p => p.tipoEntrega === tipo);

}


/* =========================================================
   9. FILTRAR POR PESQUISA
   ========================================================= */

function filtrarPorPesquisa(pedidos, termo) {

    if (!termo) return pedidos;

    const t = termo.toLowerCase().trim();

    return pedidos.filter(p => {

        const nome = (p.nome || "").toLowerCase();
        const tel = (p.telemovel || "").toLowerCase();
        const id = (p.id || "").toLowerCase();

        return nome.includes(t) || tel.includes(t) || id.includes(t);

    });

}


/* =========================================================
   10. APLICAR TODOS OS FILTROS
   ========================================================= */

function obterPedidosFiltrados() {

    let lista = [...pedidosAtuais];

    lista = filtrarPorPeriodo(lista, periodoAtual);
    lista = filtrarPorTipo(lista, tipoAtual);

    if (filtroAtual !== "todos") {
        lista = lista.filter(p => p.estado === filtroAtual);
    }

    lista = filtrarPorPesquisa(lista, pesquisaAtual);

    return lista;

}


/* =========================================================
   11. RESUMO DO DIA
   ========================================================= */

function renderizarResumoDia() {

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const pedidosHoje = pedidosAtuais.filter(p => {
        if (!p.criadoEm) return false;
        const data = p.criadoEm.toDate ? p.criadoEm.toDate() : new Date(p.criadoEm);
        return data >= inicioHoje;
    });

    const pedidosValidos = pedidosHoje.filter(p => p.estado !== "recusado");

    const totalPedidos = pedidosValidos.length;
    const receita = pedidosValidos.reduce((soma, p) => soma + (p.total || 0), 0);

    const clientesUnicos = new Set(
        pedidosValidos.map(p => p.telemovel).filter(Boolean)
    ).size;

    const entregas = pedidosValidos.filter(p => p.tipoEntrega === "entrega").length;
    const recolhas = pedidosValidos.filter(p => p.tipoEntrega === "recolha").length;

    const ticketMedio = totalPedidos > 0
        ? Math.round(receita / totalPedidos)
        : 0;

    const elPedidos = document.querySelector("#resumoPedidos");
    const elReceita = document.querySelector("#resumoReceita");
    const elClientes = document.querySelector("#resumoClientes");
    const elEntregas = document.querySelector("#resumoEntregas");
    const elRecolhas = document.querySelector("#resumoRecolhas");
    const elTicket = document.querySelector("#resumoTicket");

    if (elPedidos) elPedidos.textContent = totalPedidos;
    if (elReceita) elReceita.textContent = formatarPreco(receita);
    if (elClientes) elClientes.textContent = clientesUnicos;
    if (elEntregas) elEntregas.textContent = entregas;
    if (elRecolhas) elRecolhas.textContent = recolhas;
    if (elTicket) elTicket.textContent = formatarPreco(ticketMedio);

}


/* =========================================================
   12. ESTATÍSTICAS
   ========================================================= */

function renderizarEstatisticas() {

    let base = [...pedidosAtuais];
    base = filtrarPorPeriodo(base, periodoAtual);
    base = filtrarPorTipo(base, tipoAtual);

    const cont = {
        novo: 0,
        aceite: 0,
        em_preparacao: 0,
        pronto: 0,
        entregue: 0
    };

    base.forEach(p => {
        if (cont[p.estado] !== undefined) {
            cont[p.estado]++;
        }
    });

    const elNovo = document.querySelector("#contNovo");
    const elAceite = document.querySelector("#contAceite");
    const elPrep = document.querySelector("#contPreparacao");
    const elPronto = document.querySelector("#contPronto");
    const elEntregue = document.querySelector("#contEntregue");

    if (elNovo) elNovo.textContent = cont.novo;
    if (elAceite) elAceite.textContent = cont.aceite;
    if (elPrep) elPrep.textContent = cont.em_preparacao;
    if (elPronto) elPronto.textContent = cont.pronto;
    if (elEntregue) elEntregue.textContent = cont.entregue;

}


/* =========================================================
   13. AVISAR CLIENTE POR WHATSAPP
   ========================================================= */

function avisarCliente(pedidoId) {

    const pedido = pedidosAtuais.find(p => p.id === pedidoId);
    if (!pedido) return;

    // Limpar telemóvel
    const tel = (pedido.telemovel || "").replace(/\D/g, "");
    if (!tel) {
        alert("⚠️ Este pedido não tem telemóvel registado.");
        return;
    }

    // Garantir prefixo 258
    let numeroWhats = tel;
    if (!numeroWhats.startsWith("258")) {
        numeroWhats = "258" + numeroWhats;
    }

    // Lista de produtos
    const listaProdutos = (pedido.produtos || []).map(p =>
        `• ${p.quantidade}x ${p.nome}`
    ).join("\n");

    // Mensagem base
    const cabecalho = [
        "*🔥 BRASA GRILL*",
        "",
        "*✅ O seu pedido está PRONTO!*",
        ""
    ];

    const corpo = [
        `Olá ${pedido.nome},`,
        ""
    ];

    const detalhes = [
        "",
        "*📦 O que pediu:*",
        listaProdutos,
        "",
        `*💰 Total:* ${formatarPreco(pedido.total)}`,
        ""
    ];

    const rodape = [
        "",
        "Obrigado pela preferência! 🙏"
    ];

    let mensagemFinal;

    if (pedido.tipoEntrega === "recolha") {

        mensagemFinal = [
            ...cabecalho,
            ...corpo,
            "O seu pedido está pronto para recolha.",
            ...detalhes,
            "*📍 Venha buscar em:*",
            "Brasa Grill — Alto Maé",
            "",
            "*🕒 Horário:* Todos os dias, 7h às 23h",
            ...rodape
        ].join("\n");

    } else {

        mensagemFinal = [
            ...cabecalho,
            "*🛵 Está a caminho da sua morada.*",
            ...corpo,
            "O seu pedido acabou de sair do restaurante.",
            ...detalhes,
            `*📍 Morada:* ${pedido.morada || "—"}`,
            "",
            "*🕒 Chega em breve.*",
            ...rodape
        ].join("\n");

    }

    // Abrir WhatsApp
    const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(url, "_blank");

}


/* =========================================================
   14. RENDERIZAR PEDIDOS
   ========================================================= */

function renderizarPedidos() {

    const pedidosFiltrados = obterPedidosFiltrados();

    if (pedidosFiltrados.length === 0) {

        let msg = "Nenhum pedido";

        if (pesquisaAtual) {
            msg += ` para "${pesquisaAtual}"`;
        } else if (filtroAtual !== "todos") {
            msg += ` no estado "${filtroAtual}"`;
        } else if (tipoAtual !== "todos") {
            msg += ` do tipo "${tipoAtual}"`;
        } else {
            msg += ` no período "${periodoAtual}"`;
        }

        listaPedidos.innerHTML = `
            <div class="sem-pedidos">
                <i data-lucide="inbox"></i>
                <p>${msg}.</p>
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


        let infoExtra = "";

        if (pedido.tipoEntrega === "entrega") {
            infoExtra += `
                <div>
                    <span>Entrega:</span>
                    <span>${pedido.zona || "—"}</span>
                </div>
                <div>
                    <span>Morada:</span>
                    <span>${pedido.morada || "—"}</span>
                </div>
            `;
        } else if (pedido.tipoEntrega === "recolha") {
            infoExtra += `
                <div>
                    <span>Tipo:</span>
                    <span>Recolha no restaurante</span>
                </div>
            `;
        }

        if (pedido.metodoPagamento) {
            const metodos = {
                mpesa: "M-Pesa",
                emola: "e-Mola",
                numerario: "Numerário"
            };
            infoExtra += `
                <div>
                    <span>Pagamento:</span>
                    <span>${metodos[pedido.metodoPagamento] || pedido.metodoPagamento}</span>
                </div>
            `;
        }


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

                    ${infoExtra}

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
                        <button class="btn-acao btn-avisar" data-avisar="${pedido.id}">
                            <i data-lucide="message-circle"></i> Avisar cliente
                        </button>
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
   15. AÇÕES NOS PEDIDOS
   ========================================================= */

listaPedidos.addEventListener("click", async function (e) {

    // Botão "Avisar cliente"
    const btnAvisar = e.target.closest("[data-avisar]");
    if (btnAvisar) {
        avisarCliente(btnAvisar.dataset.avisar);
        return;
    }

    // Botões de ação
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
   16. EVENTOS DOS FILTROS
   ========================================================= */

btnFiltros.forEach(btn => {
    btn.addEventListener("click", function () {
        filtroAtual = this.dataset.filtro;
        btnFiltros.forEach(b => b.classList.remove("ativo"));
        this.classList.add("ativo");
        renderizarPedidos();
    });
});


btnPeriodos.forEach(btn => {
    btn.addEventListener("click", function () {
        periodoAtual = this.dataset.periodo;
        btnPeriodos.forEach(b => b.classList.remove("ativo"));
        this.classList.add("ativo");
        renderizarResumoDia();
        renderizarEstatisticas();
        renderizarPedidos();
    });
});


btnTipos.forEach(btn => {
    btn.addEventListener("click", function () {
        tipoAtual = this.dataset.tipo;
        btnTipos.forEach(b => b.classList.remove("ativo"));
        this.classList.add("ativo");
        renderizarEstatisticas();
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
   17. PESQUISA
   ========================================================= */

if (inputPesquisa) {

    inputPesquisa.addEventListener("input", function () {

        pesquisaAtual = this.value;

        if (btnLimparPesquisa) {
            btnLimparPesquisa.hidden = !pesquisaAtual;
        }

        renderizarPedidos();

    });

}

if (btnLimparPesquisa) {

    btnLimparPesquisa.addEventListener("click", function () {

        pesquisaAtual = "";
        if (inputPesquisa) inputPesquisa.value = "";
        this.hidden = true;

        renderizarPedidos();

    });

}


/* =========================================================
   18. INICIAR
   ========================================================= */

verificarLogin();

window.addEventListener("load", recriarIcones);