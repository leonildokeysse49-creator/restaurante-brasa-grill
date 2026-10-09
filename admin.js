/* =========================================================
   BRASA GRILL — PAINEL DO RESTAURANTE
   ========================================================= */

const ADMIN_PASSWORD = "brasa2026";
const ADMIN_NOME = "Leonildo";
const SESSION_KEY = "brasaGrillAdmin";
const SESSION_NOME = "brasaGrillNome";


/* AUXILIARES */

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-MZ").format(valor) + " MT";
}

function recriarIcones() {
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function formatarData(timestamp) {
    if (!timestamp) return "—";
    try {
        const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");
        return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
    } catch (e) { return "—"; }
}

function saudacaoPorHora() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 20) return "Boa tarde";
    return "Boa noite";
}

function gerarPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
}


/* ESTADO */

let pedidosAtuais = [];
let estafetasAtuais = [];
let filtroAtual = "todos";
let periodoAtual = "hoje";
let tipoAtual = "todos";
let pesquisaAtual = "";
let idsAnteriores = new Set();
let primeiraCarga = true;


/* ELEMENTOS */

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
const listaEstafetas = document.querySelector("#listaEstafetas");
const btnNovoEstafeta = document.querySelector("#btnNovoEstafeta");
const modalEstafeta = document.querySelector("#modalEstafeta");
const formEstafeta = document.querySelector("#formEstafeta");
const tituloModalEstafeta = document.querySelector("#tituloModalEstafeta");


/* LOGIN / LOGOUT */

function verificarLogin() {
    const logado = sessionStorage.getItem(SESSION_KEY);
    if (logado === "sim") {
        const nome = sessionStorage.getItem(SESSION_NOME) || ADMIN_NOME;
        ecraLogin.hidden = true;
        ecraBoasVindas.hidden = true;
        painel.hidden = false;
        if (saudacaoPainel) saudacaoPainel.textContent = `${saudacaoPorHora()}, ${nome} — Pedidos em tempo real`;
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
    if (boasVindasNome) boasVindasNome.textContent = nome;
    recriarIcones();
}

function entrarNoPainel(nome) {
    ecraLogin.hidden = true;
    ecraBoasVindas.hidden = true;
    painel.hidden = false;
    if (saudacaoPainel) saudacaoPainel.textContent = `${saudacaoPorHora()}, ${nome} — Pedidos em tempo real`;
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
            setTimeout(() => entrarNoPainel(ADMIN_NOME), 2000);
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
        mostrarLogin();
    });
}


/* INICIAR PAINEL */

function iniciarPainel() {
    db.collection("pedidos").orderBy("criadoEm", "desc").limit(200).onSnapshot(snapshot => {
        if (indicadorLigacao) {
            indicadorLigacao.innerHTML = '<i data-lucide="wifi"></i> Em direto';
            indicadorLigacao.classList.remove("offline");
        }

        const novos = [];
        snapshot.forEach(doc => novos.push({ id: doc.id, ...doc.data() }));

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
        console.error("❌ Erro Firestore:", erro);
        if (indicadorLigacao) {
            indicadorLigacao.innerHTML = '<i data-lucide="wifi-off"></i> Sem ligação';
            indicadorLigacao.classList.add("offline");
        }
    });

    db.collection("estafetas").orderBy("nome").onSnapshot(snapshot => {
        estafetasAtuais = [];
        snapshot.forEach(doc => estafetasAtuais.push({ id: doc.id, ...doc.data() }));
        renderizarEstafetas();
    });
}


/* FILTROS */

function filtrarPorPeriodo(pedidos, periodo) {
    if (periodo === "tudo") return pedidos;
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    return pedidos.filter(p => {
        if (!p.criadoEm) return false;
        const data = p.criadoEm.toDate ? p.criadoEm.toDate() : new Date(p.criadoEm);
        switch (periodo) {
            case "hoje": return data >= hoje;
            case "ontem": {
                const o = new Date(hoje); o.setDate(o.getDate() - 1);
                return data >= o && data < hoje;
            }
            case "7dias": {
                const s = new Date(hoje); s.setDate(s.getDate() - 7);
                return data >= s;
            }
            case "mes": {
                const i = new Date(agora.getFullYear(), agora.getMonth(), 1);
                return data >= i;
            }
            default: return true;
        }
    });
}

function filtrarPorTipo(pedidos, tipo) {
    if (tipo === "todos") return pedidos;
    return pedidos.filter(p => p.tipoEntrega === tipo);
}

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

function obterPedidosFiltrados() {
    let lista = [...pedidosAtuais];
    lista = filtrarPorPeriodo(lista, periodoAtual);
    lista = filtrarPorTipo(lista, tipoAtual);
    if (filtroAtual !== "todos") lista = lista.filter(p => p.estado === filtroAtual);
    lista = filtrarPorPesquisa(lista, pesquisaAtual);
    return lista;
}


/* RESUMO */

function renderizarResumoDia() {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const pedidosHoje = pedidosAtuais.filter(p => {
        if (!p.criadoEm) return false;
        const data = p.criadoEm.toDate ? p.criadoEm.toDate() : new Date(p.criadoEm);
        return data >= inicioHoje;
    });

    const validos = pedidosHoje.filter(p => p.estado !== "recusado");
    const total = validos.length;
    const receita = validos.reduce((s, p) => s + (p.total || 0), 0);
    const clientes = new Set(validos.map(p => p.telemovel).filter(Boolean)).size;
    const entregas = validos.filter(p => p.tipoEntrega === "entrega").length;
    const recolhas = validos.filter(p => p.tipoEntrega === "recolha").length;
    const media = total > 0 ? Math.round(receita / total) : 0;

    const elP = document.querySelector("#resumoPedidos");
    const elR = document.querySelector("#resumoReceita");
    const elC = document.querySelector("#resumoClientes");
    const elE = document.querySelector("#resumoEntregas");
    const elRe = document.querySelector("#resumoRecolhas");
    const elM = document.querySelector("#resumoTicket");

    if (elP) elP.textContent = total;
    if (elR) elR.textContent = formatarPreco(receita);
    if (elC) elC.textContent = clientes;
    if (elE) elE.textContent = entregas;
    if (elRe) elRe.textContent = recolhas;
    if (elM) elM.textContent = formatarPreco(media);
}


/* ESTATÍSTICAS */

function renderizarEstatisticas() {
    let base = [...pedidosAtuais];
    base = filtrarPorPeriodo(base, periodoAtual);
    base = filtrarPorTipo(base, tipoAtual);

    const cont = { novo: 0, aceite: 0, em_preparacao: 0, pronto: 0, a_caminho: 0, entregue: 0 };
    base.forEach(p => { if (cont[p.estado] !== undefined) cont[p.estado]++; });

    const elN = document.querySelector("#contNovo");
    const elA = document.querySelector("#contAceite");
    const elP = document.querySelector("#contPreparacao");
    const elPr = document.querySelector("#contPronto");
    const elAC = document.querySelector("#contACaminho");
    const elE = document.querySelector("#contEntregue");

    if (elN) elN.textContent = cont.novo;
    if (elA) elA.textContent = cont.aceite;
    if (elP) elP.textContent = cont.em_preparacao;
    if (elPr) elPr.textContent = cont.pronto;
    if (elAC) elAC.textContent = cont.a_caminho;
    if (elE) elE.textContent = cont.entregue;
}


/* FALAR COM CLIENTE */

function falarComCliente(pedidoId, motivo) {
    const pedido = pedidosAtuais.find(p => p.id === pedidoId);
    if (!pedido) return;

    const tel = (pedido.telemovel || "").replace(/\D/g, "");
    if (!tel) { alert("⚠️ Este pedido não tem telemóvel registado."); return; }

    let numeroWhats = tel;
    if (!numeroWhats.startsWith("258")) numeroWhats = "258" + numeroWhats;

    const listaProdutos = (pedido.produtos || []).map(p => `• ${p.quantidade}x ${p.nome}`).join("\n");
    const total = formatarPreco(pedido.total);
    const cabecalho = "*🔥 BRASA GRILL*\n";
    let mensagem = "";

    if (motivo === "taxa") {
        mensagem = [
            cabecalho, "",
            `Olá ${pedido.nome},`, "",
            "Recebemos o seu pedido:", "",
            "*📦 Pedido:*", listaProdutos, "",
            `*💰 Subtotal:* ${total}`, "",
            "*📍 Entrega em:*", pedido.morada || "—",
            pedido.referencia ? `Referência: ${pedido.referencia}` : "",
            "",
            "Para combinarmos a entrega,",
            "que valor propõe?"
        ].join("\n");
    }

    if (motivo === "pronto") {
        if (pedido.tipoEntrega === "recolha") {
            mensagem = [
                cabecalho, "",
                "*✅ O seu pedido está pronto!*", "",
                `Olá ${pedido.nome},`, "",
                "O seu pedido já pode ser recolhido",
                "no nosso restaurante.", "",
                "*📦 Pedido:*", listaProdutos, "",
                `*💰 Total:* ${total}`, "",
                "*📍 Recolha em:*",
                "Brasa Grill — Alto Maé", "",
                "*🕒 Todos os dias, das 7h às 23h*", "",
                "Obrigado pela preferência! 🙏"
            ].join("\n");
        } else {
            mensagem = [
                cabecalho, "",
                "*✅ O seu pedido está pronto!*", "",
                `Olá ${pedido.nome},`, "",
                "O seu pedido está preparado e",
                "sairá para entrega em breve.", "",
                "*📦 Pedido:*", listaProdutos, "",
                `*💰 Total:* ${total}`, "",
                `*📍 Morada:* ${pedido.morada || "—"}`, "",
                "*🛵 Aguarde a chegada do estafeta.*", "",
                "Obrigado pela preferência! 🙏"
            ].join("\n");
        }
    }

    if (motivo === "a_caminho") {
        mensagem = [
            cabecalho, "",
            "*🛵 O seu pedido saiu para entrega!*", "",
            `Olá ${pedido.nome},`, "",
            "O estafeta está a caminho",
            "da sua morada.", "",
            "*📦 Pedido:*", listaProdutos, "",
            `*💰 Total:* ${total}`, "",
            `*📍 Entrega em:* ${pedido.morada || "—"}`, "",
            "*🕒 Chega dentro de momentos.*", "",
            "Obrigado pela preferência! 🙏"
        ].join("\n");
    }

    const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
}


/* RENDERIZAR PEDIDOS */

function renderizarPedidos() {
    const pedidosFiltrados = obterPedidosFiltrados();

    if (pedidosFiltrados.length === 0) {
        listaPedidos.innerHTML = `
            <div class="sem-pedidos">
                <i data-lucide="inbox"></i>
                <p>Nenhum pedido de momento.</p>
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
            a_caminho: "🛵 A caminho",
            entregue: "✔️ Entregue",
            recusado: "❌ Recusado"
        }[pedido.estado] || pedido.estado;

        const produtosHTML = (pedido.produtos || []).map(p => `
            <li><span>${p.quantidade}× ${p.nome}</span><span>${formatarPreco(p.subtotal)}</span></li>
        `).join("");

        let infoExtra = "";

        if (pedido.tipoEntrega === "entrega") {
            infoExtra += `<div><span>Tipo:</span><span>Entrega ao domicílio</span></div>`;
            infoExtra += `<div><span>Morada:</span><span>${pedido.morada || "—"}</span></div>`;
            if (pedido.referencia) infoExtra += `<div><span>Referência:</span><span>${pedido.referencia}</span></div>`;
            if (pedido.localizacao && pedido.localizacao.lat) {
                const link = `https://www.google.com/maps?q=${pedido.localizacao.lat},${pedido.localizacao.lng}`;
                infoExtra += `<div><span>Localização:</span><span><a href="${link}" target="_blank" style="color:var(--amarelo);">Abrir no mapa</a></span></div>`;
            }
        } else if (pedido.tipoEntrega === "recolha") {
            infoExtra += `<div><span>Tipo:</span><span>Recolha no restaurante</span></div>`;
        }

        if (pedido.metodoPagamento) {
            const m = { mpesa: "M-Pesa", emola: "e-Mola", numerario: "Numerário" };
            infoExtra += `<div><span>Pagamento:</span><span>${m[pedido.metodoPagamento] || pedido.metodoPagamento}</span></div>`;
        }

        if (pedido.estafetaNome) {
            infoExtra += `<div><span>Estafeta:</span><span>🛵 ${pedido.estafetaNome}</span></div>`;
        }


        let botoesHTML = "";

        if (pedido.estado === "novo") {
            botoesHTML = `
                <button class="btn-acao btn-aceitar" data-acao="aceite" data-id="${pedido.id}"><i data-lucide="check"></i> Aceitar</button>
                <button class="btn-acao btn-recusar" data-acao="recusado" data-id="${pedido.id}"><i data-lucide="x"></i> Recusar</button>
            `;
            if (pedido.tipoEntrega === "entrega") {
                botoesHTML += `<button class="btn-acao btn-falar" data-falar="taxa" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Combinar taxa</button>`;
            }
        } else if (pedido.estado === "aceite") {
            botoesHTML = `<button class="btn-acao btn-preparar" data-acao="em_preparacao" data-id="${pedido.id}"><i data-lucide="chef-hat"></i> Preparar</button>`;
        } else if (pedido.estado === "em_preparacao") {
            botoesHTML = `<button class="btn-acao btn-pronto" data-acao="pronto" data-id="${pedido.id}"><i data-lucide="package"></i> Pronto</button>`;
        } else if (pedido.estado === "pronto") {
            if (pedido.tipoEntrega === "recolha") {
                botoesHTML = `
                    <button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button>
                    <button class="btn-acao btn-entregar" data-acao="entregue" data-id="${pedido.id}"><i data-lucide="check-check"></i> Entregue</button>
                `;
            } else {
                if (pedido.estafetaId) {
                    botoesHTML = `
                        <button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button>
                        <button class="btn-acao btn-caminho" data-acao="a_caminho" data-id="${pedido.id}"><i data-lucide="bike"></i> Saiu para entrega</button>
                    `;
                } else {
                    botoesHTML = `
                        <button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button>
                        <button class="btn-acao btn-atribuir" data-atribuir="${pedido.id}"><i data-lucide="user-plus"></i> Atribuir estafeta</button>
                    `;
                }
            }
        } else if (pedido.estado === "a_caminho") {
            botoesHTML = `
                <button class="btn-acao btn-avisar" data-falar="a_caminho" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button>
                <button class="btn-acao btn-entregar" data-acao="entregue" data-id="${pedido.id}"><i data-lucide="check-check"></i> Entregue</button>
            `;
        } else if (pedido.estado === "entregue" || pedido.estado === "recusado") {
            botoesHTML = `<button class="btn-acao btn-apagar" data-acao="apagar" data-id="${pedido.id}"><i data-lucide="trash-2"></i> Apagar</button>`;
        }


        return `
            <article class="pedido estado-${pedido.estado}" data-id="${pedido.id}">
                <div class="pedido-topo">
                    <h3>${pedido.nome}<small>${data}</small></h3>
                    <span class="pedido-estado ${pedido.estado}">${estadoTexto}</span>
                </div>

                <div class="pedido-info">
                    <div><span>Telemóvel:</span><span><a href="tel:${pedido.telemovel}" style="color:var(--amarelo);">${pedido.telemovel}</a></span></div>
                    ${pedido.email ? `<div><span>Email:</span><span>${pedido.email}</span></div>` : ""}
                    ${infoExtra}
                </div>

                <div class="pedido-produtos">
                    <strong>Produtos</strong>
                    <ul>${produtosHTML}</ul>
                </div>

                ${pedido.observacoes ? `<div class="pedido-produtos"><strong>Observações</strong><p style="color:var(--texto); margin-top:4px;">${pedido.observacoes}</p></div>` : ""}

                <div class="pedido-total">
                    <span>TOTAL</span>
                    <span>${formatarPreco(pedido.total)}</span>
                </div>

                <div class="pedido-acoes">${botoesHTML}</div>
            </article>
        `;
    }).join("");

    recriarIcones();
}


/* AÇÕES NOS PEDIDOS */

listaPedidos.addEventListener("click", async function (e) {
    const btnFalar = e.target.closest("[data-falar]");
    if (btnFalar) { falarComCliente(btnFalar.dataset.id, btnFalar.dataset.falar); return; }

    const btnAtribuir = e.target.closest("[data-atribuir]");
    if (btnAtribuir) { abrirAtribuirEstafeta(btnAtribuir.dataset.atribuir); return; }

    const btn = e.target.closest("[data-acao]");
    if (!btn) return;

    const id = btn.dataset.id;
    const acao = btn.dataset.acao;

    try {
        if (acao === "apagar") {
            if (!confirm("Tem a certeza que quer apagar este pedido?")) return;
            await apagarPedido(id);
        } else {
            await atualizarEstadoPedido(id, acao);
        }
    } catch (e) {
        console.error("Erro:", e);
        alert("❌ Não foi possível atualizar o pedido.");
    }
});


/* ATRIBUIR ESTAFETA */

function abrirAtribuirEstafeta(pedidoId) {
    const disponiveis = estafetasAtuais.filter(e => e.ativo !== false);

    if (disponiveis.length === 0) {
        alert("⚠️ Nenhum estafeta registado. Vá a 'Estafetas' e adicione um.");
        return;
    }

    const opcoes = disponiveis.map(e => `${e.nome} (${e.telemovel}) — ${e.estado || "offline"}`).join("\n");
    const escolhido = prompt(`Escolha o estafeta (escreva o nome):\n\n${opcoes}`);

    if (!escolhido) return;

    const estafeta = disponiveis.find(e => e.nome.toLowerCase() === escolhido.trim().toLowerCase());

    if (!estafeta) { alert("❌ Estafeta não encontrado."); return; }

    atribuirEstafetaAoPedido(pedidoId, estafeta);
}

async function atribuirEstafetaAoPedido(pedidoId, estafeta) {
    try {
        await db.collection("pedidos").doc(pedidoId).update({
            estafetaId: estafeta.id,
            estafetaNome: estafeta.nome,
            estafetaTelemovel: estafeta.telemovel,
            atribuidoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`✅ Pedido atribuído a ${estafeta.nome}`);
    } catch (erro) {
        console.error("Erro:", erro);
        alert("❌ Não foi possível atribuir.");
    }
}


/* GESTÃO DE ESTAFETAS */

function renderizarEstafetas() {
    if (!listaEstafetas) return;

    const ativos = estafetasAtuais.filter(e => e.ativo !== false);

    if (ativos.length === 0) {
        listaEstafetas.innerHTML = `<div class="sem-estafetas"><i data-lucide="inbox"></i><p>Nenhum estafeta registado.</p></div>`;
        recriarIcones();
        return;
    }

    listaEstafetas.innerHTML = ativos.map(e => {
        const tipoTexto = e.tipo === "proprio" ? "Próprio" : "Opcional";
        const estadoTexto = e.estado || "offline";
        const cores = { disponivel: "#25d366", ocupado: "#f97316", offline: "#bdbdbd" };

        return `
            <div class="estafeta-card" data-id="${e.id}">
                <div class="estafeta-card-info">
                    <strong>🛵 ${e.nome}</strong>
                    <p>${e.telemovel} · ${tipoTexto}</p>
                </div>
                <span class="estafeta-estado" style="color: ${cores[estadoTexto] || "#bdbdbd"}">● ${estadoTexto}</span>
                <div class="estafeta-acoes">
                    <button type="button" class="btn-mini btn-editar" data-editar-estafeta="${e.id}"><i data-lucide="pencil"></i></button>
                    <button type="button" class="btn-mini btn-remover" data-remover-estafeta="${e.id}"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
    }).join("");

    recriarIcones();
}

if (btnNovoEstafeta) {
    btnNovoEstafeta.addEventListener("click", function () {
        formEstafeta.reset();
        document.querySelector("#estafetaId").value = "";
        document.querySelector("#estafetaPassword").value = gerarPassword();
        tituloModalEstafeta.textContent = "Novo estafeta";
        modalEstafeta.hidden = false;
        setTimeout(() => document.querySelector("#estafetaNome").focus(), 100);
    });
}

document.querySelectorAll("[data-fechar-estafeta]").forEach(el => {
    el.addEventListener("click", () => { modalEstafeta.hidden = true; });
});

if (formEstafeta) {
    formEstafeta.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.querySelector("#estafetaId").value;
        const nome = document.querySelector("#estafetaNome").value.trim();
        const telemovel = document.querySelector("#estafetaTelemovel").value.trim();
        const password = document.querySelector("#estafetaPassword").value.trim();
        const tipo = document.querySelector("#estafetaTipo").value;

        if (!nome || !telemovel || !password) { alert("Preencha todos os campos."); return; }

        try {
            if (id) {
                await db.collection("estafetas").doc(id).update({
                    nome, telemovel, password, tipo,
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`✅ Estafeta ${nome} atualizado.`);
            } else {
                await db.collection("estafetas").add({
                    nome, telemovel, password, tipo,
                    estado: "offline",
                    ativo: true,
                    entregas_hoje: 0,
                    ganhos_hoje: 0,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`✅ Estafeta ${nome} criado.\n\nPassword: ${password}\nEnvie por WhatsApp ao estafeta.`);
            }
            modalEstafeta.hidden = true;
        } catch (erro) {
            console.error("Erro estafeta:", erro);
            alert("❌ Não foi possível guardar.");
        }
    });
}

if (listaEstafetas) {
    listaEstafetas.addEventListener("click", async function (e) {
        const btnEditar = e.target.closest("[data-editar-estafeta]");
        if (btnEditar) {
            const est = estafetasAtuais.find(x => x.id === btnEditar.dataset.editarEstafeta);
            if (!est) return;
            document.querySelector("#estafetaId").value = est.id;
            document.querySelector("#estafetaNome").value = est.nome || "";
            document.querySelector("#estafetaTelemovel").value = est.telemovel || "";
            document.querySelector("#estafetaPassword").value = est.password || "";
            document.querySelector("#estafetaTipo").value = est.tipo || "proprio";
            tituloModalEstafeta.textContent = "Editar estafeta";
            modalEstafeta.hidden = false;
            return;
        }

        const btnRemover = e.target.closest("[data-remover-estafeta]");
        if (btnRemover) {
            const est = estafetasAtuais.find(x => x.id === btnRemover.dataset.removerEstafeta);
            if (!est) return;
            if (!confirm(`Remover ${est.nome}?`)) return;
            try {
                await db.collection("estafetas").doc(est.id).update({
                    ativo: false,
                    removidoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("✅ Estafeta removido.");
            } catch (erro) { console.error(erro); alert("❌ Erro."); }
        }
    });
}


/* FILTROS EVENTOS */

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
        const c = [...btnFiltros].find(b => b.dataset.filtro === filtroAtual);
        if (c) c.classList.add("ativo");
        renderizarPedidos();
    });
});

if (inputPesquisa) {
    inputPesquisa.addEventListener("input", function () {
        pesquisaAtual = this.value;
        if (btnLimparPesquisa) btnLimparPesquisa.hidden = !pesquisaAtual;
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


/* INICIAR */

verificarLogin();
window.addEventListener("load", recriarIcones);