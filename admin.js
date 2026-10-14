/* =========================================================
   BRASA GRILL — PAINEL DO RESTAURANTE (FIREBASE AUTH)
   ========================================================= */

/* UID do admin principal */
const ADMIN_UID = "d35l2omKgieZCq77JocJLnqGxZ32";

/* ESTADO */

let pedidosAtuais = [];
let estafetasAtuais = [];
let garconsAtuais = [];
let filtroAtual = "todos";
let periodoAtual = "hoje";
let tipoAtual = "todos";
let pesquisaAtual = "";
let idsAnteriores = new Set();
let primeiraCarga = true;

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

/* ELEMENTOS */

const ecraLogin = document.querySelector("#ecraLogin");
const ecraBoasVindas = document.querySelector("#ecraBoasVindas");
const boasVindasNome = document.querySelector("#boasVindasNome");
const painel = document.querySelector("#painel");
const saudacaoPainel = document.querySelector("#saudacaoPainel");
const formLogin = document.querySelector("#formLogin");
const emailInput = document.querySelector("#emailInput");
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
const listaGarcons = document.querySelector("#listaGarcons");
const btnNovoGarcom = document.querySelector("#btnNovoGarcom");
const modalGarcom = document.querySelector("#modalGarcom");
const formGarcom = document.querySelector("#formGarcom");
const tituloModalGarcom = document.querySelector("#tituloModalGarcom");
const modalCredenciais = document.querySelector("#modalCredenciais");
const credEmail = document.querySelector("#credEmail");
const credSenha = document.querySelector("#credSenha");
const btnCopiarCred = document.querySelector("#btnCopiarCred");
const btnWhatsCred = document.querySelector("#btnWhatsCred");
const previewEmailEstafeta = document.querySelector("#previewEmailEstafeta");
const previewEmailGarcom = document.querySelector("#previewEmailGarcom");

/* LOGIN */

formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    erroLogin.hidden = true;

    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, pass);

        const role = (cred.user.uid === ADMIN_UID) ? "admin" : await obterRole(cred.user);

        console.log("✅ Login OK:", cred.user.email, "| UID:", cred.user.uid, "| Role:", role);

        if (role !== "admin") {
            await firebase.auth().signOut();
            erroLogin.textContent = "❌ Esta conta não tem permissão de administrador.";
            erroLogin.hidden = false;
            return;
        }

        const nome = cred.user.displayName || "Leonildo";
        mostrarBoasVindas(nome);
        setTimeout(() => entrarNoPainel(nome), 2000);

    } catch (erro) {
        console.error("Erro login:", erro);
        let msg = "❌ Email ou palavra-passe incorretos.";
        if (erro.code === "auth/too-many-requests") msg = "⚠️ Demasiadas tentativas. Tenta mais tarde.";
        if (erro.code === "auth/network-request-failed") msg = "⚠️ Sem ligação à internet.";
        erroLogin.textContent = msg;
        erroLogin.hidden = false;
        passwordInput.value = "";
    }
});

function mostrarLogin() {
    ecraLogin.hidden = false;
    ecraBoasVindas.hidden = true;
    painel.hidden = true;
    setTimeout(() => emailInput?.focus(), 100);
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

btnSair.addEventListener("click", async function () {
    if (!confirm("Quer mesmo sair do painel?")) return;
    primeiraCarga = true;
    idsAnteriores = new Set();
    pedidosAtuais = [];
    try { await firebase.auth().signOut(); } catch (e) { console.warn(e); }
    location.reload();
});

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user || user.isAnonymous) {
        mostrarLogin();
        return;
    }

    const role = (user.uid === ADMIN_UID) ? "admin" : await obterRole(user);

    if (role !== "admin") {
        await firebase.auth().signOut();
        mostrarLogin();
        return;
    }

    const nome = user.displayName || "Leonildo";
    entrarNoPainel(nome);
});

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
                    console.log("🔔 Novo pedido:", pedido.nome || `Mesa ${pedido.numeroMesa}`);
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

    db.collection("garcons").orderBy("nome").onSnapshot(snapshot => {
        garconsAtuais = [];
        snapshot.forEach(doc => garconsAtuais.push({ id: doc.id, ...doc.data() }));
        renderizarGarcons();
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
    if (tipo === "mesa") return pedidos.filter(p => p.tipoPedido === "mesa");
    return pedidos.filter(p => p.tipoPedido !== "mesa" && p.tipoEntrega === tipo);
}

function filtrarPorPesquisa(pedidos, termo) {
    if (!termo) return pedidos;
    const t = termo.toLowerCase().trim();
    return pedidos.filter(p => {
        const nome = (p.nome || "").toLowerCase();
        const tel = (p.telemovel || "").toLowerCase();
        const id = (p.id || "").toLowerCase();
        const garcom = (p.garcomNome || "").toLowerCase();
        const mesa = String(p.numeroMesa || "");
        return nome.includes(t) || tel.includes(t) || id.includes(t) || garcom.includes(t) || mesa.includes(t);
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
    const clientes = new Set(validos.filter(p => p.tipoPedido !== "mesa").map(p => p.telemovel).filter(Boolean)).size;
    const entregas = validos.filter(p => p.tipoPedido !== "mesa" && p.tipoEntrega === "entrega").length;
    const recolhas = validos.filter(p => p.tipoPedido !== "mesa" && p.tipoEntrega === "recolha").length;
    const mesas = validos.filter(p => p.tipoPedido === "mesa").length;
    const media = total > 0 ? Math.round(receita / total) : 0;

    const elP = document.querySelector("#resumoPedidos");
    const elR = document.querySelector("#resumoReceita");
    const elC = document.querySelector("#resumoClientes");
    const elE = document.querySelector("#resumoEntregas");
    const elRe = document.querySelector("#resumoRecolhas");
    const elMe = document.querySelector("#resumoMesas");
    const elM = document.querySelector("#resumoTicket");

    if (elP) elP.textContent = total;
    if (elR) elR.textContent = formatarPreco(receita);
    if (elC) elC.textContent = clientes;
    if (elE) elE.textContent = entregas;
    if (elRe) elRe.textContent = recolhas;
    if (elMe) elMe.textContent = mesas;
    if (elM) elM.textContent = formatarPreco(media);
}

/* ESTATÍSTICAS */

function renderizarEstatisticas() {
    let base = [...pedidosAtuais];
    base = filtrarPorPeriodo(base, periodoAtual);
    base = filtrarPorTipo(base, tipoAtual);
    const cont = { novo: 0, aceite: 0, em_preparacao: 0, pronto: 0, a_caminho: 0, servido: 0, entregue: 0 };
    base.forEach(p => { if (cont[p.estado] !== undefined) cont[p.estado]++; });
    const elN = document.querySelector("#contNovo");
    const elA = document.querySelector("#contAceite");
    const elP = document.querySelector("#contPreparacao");
    const elPr = document.querySelector("#contPronto");
    const elAC = document.querySelector("#contACaminho");
    const elS = document.querySelector("#contServido");
    const elE = document.querySelector("#contEntregue");
    if (elN) elN.textContent = cont.novo;
    if (elA) elA.textContent = cont.aceite;
    if (elP) elP.textContent = cont.em_preparacao;
    if (elPr) elPr.textContent = cont.pronto;
    if (elAC) elAC.textContent = cont.a_caminho;
    if (elS) elS.textContent = cont.servido;
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
        mensagem = [cabecalho, "", `Olá ${pedido.nome},`, "", "Recebemos o seu pedido:", "", "*📦 Pedido:*", listaProdutos, "", `*💰 Subtotal:* ${total}`, "", "*📍 Entrega em:*", pedido.morada || "—", pedido.referencia ? `Referência: ${pedido.referencia}` : "", "", "Para combinarmos a entrega,", "que valor propõe?"].join("\n");
    }
    if (motivo === "pronto") {
        if (pedido.tipoEntrega === "recolha") {
            mensagem = [cabecalho, "", "*✅ O seu pedido está pronto!*", "", `Olá ${pedido.nome},`, "", "O seu pedido já pode ser recolhido", "no nosso restaurante.", "", "*📦 Pedido:*", listaProdutos, "", `*💰 Total:* ${total}`, "", "*📍 Recolha em:*", "Brasa Grill — Alto Maé", "", "*🕒 Todos os dias, das 7h às 23h*", "", "Obrigado pela preferência! 🙏"].join("\n");
        } else {
            mensagem = [cabecalho, "", "*✅ O seu pedido está pronto!*", "", `Olá ${pedido.nome},`, "", "O seu pedido está preparado e", "sairá para entrega em breve.", "", "*📦 Pedido:*", listaProdutos, "", `*💰 Total:* ${total}`, "", `*📍 Morada:* ${pedido.morada || "—"}`, "", "*🛵 Aguarde a chegada do estafeta.*", "", "Obrigado pela preferência! 🙏"].join("\n");
        }
    }
    if (motivo === "a_caminho") {
        mensagem = [cabecalho, "", "*🛵 O seu pedido saiu para entrega!*", "", `Olá ${pedido.nome},`, "", "O estafeta está a caminho", "da sua morada.", "", "*📦 Pedido:*", listaProdutos, "", `*💰 Total:* ${total}`, "", `*📍 Entrega em:* ${pedido.morada || "—"}`, "", "*🕒 Chega dentro de momentos.*", "", "Obrigado pela preferência! 🙏"].join("\n");
    }
    const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
}

/* RENDERIZAR PEDIDOS */

function renderizarPedidos() {
    const pedidosFiltrados = obterPedidosFiltrados();
    if (pedidosFiltrados.length === 0) {
        listaPedidos.innerHTML = `<div class="sem-pedidos"><i data-lucide="inbox"></i><p>Nenhum pedido de momento.</p></div>`;
        recriarIcones();
        return;
    }
    listaPedidos.innerHTML = pedidosFiltrados.map(pedido => {
        const ehMesa = pedido.tipoPedido === "mesa";
        const data = formatarData(pedido.criadoEm);
        const estadoTexto = { novo: "🆕 Novo", aceite: "✅ Aceite", em_preparacao: "👨‍🍳 Em preparação", pronto: "📦 Pronto", a_caminho: "🛵 A caminho", servido: "🍽️ Servido", entregue: "✔️ Entregue", pago: "💰 Pago", recusado: "❌ Recusado" }[pedido.estado] || pedido.estado;
        const produtosHTML = (pedido.produtos || []).map(p => `<li><span>${p.quantidade}× ${p.nome}</span><span>${formatarPreco(p.subtotal || p.preco * p.quantidade)}</span></li>`).join("");
        let infoExtra = "";

        if (ehMesa) {
            infoExtra += `<div><span>Tipo:</span><span>🍽️ Mesa ${pedido.numeroMesa}</span></div>`;
            if (pedido.garcomNome) infoExtra += `<div><span>Garçom:</span><span>👨‍🍳 ${pedido.garcomNome}</span></div>`;
        } else if (pedido.tipoEntrega === "entrega") {
            infoExtra += `<div><span>Tipo:</span><span>Entrega ao domicílio</span></div>`;
            infoExtra += `<div><span>Morada:</span><span>${pedido.morada || "—"}</span></div>`;
            if (pedido.referencia) infoExtra += `<div><span>Referência:</span><span>${pedido.referencia}</span></div>`;
            if (pedido.localizacao && pedido.localizacao.lat) {
                const link = `https://www.google.com/maps?q=${pedido.localizacao.lat},${pedido.localizacao.lng}`;
                infoExtra += `<div><span>Localização:</span><span><a href="${link}" target="_blank" style="color:var(--amarelo);">Abrir no mapa</a></span></div>`;
            }
            if (pedido.metodoPagamento) {
                const m = { mpesa: "M-Pesa", emola: "e-Mola", numerario: "Numerário" };
                infoExtra += `<div><span>Pagamento:</span><span>${m[pedido.metodoPagamento] || pedido.metodoPagamento}</span></div>`;
            }
            if (pedido.estafetaNome) infoExtra += `<div><span>Estafeta:</span><span>🛵 ${pedido.estafetaNome}</span></div>`;
        } else if (pedido.tipoEntrega === "recolha") {
            infoExtra += `<div><span>Tipo:</span><span>Recolha no restaurante</span></div>`;
            if (pedido.metodoPagamento) {
                const m = { mpesa: "M-Pesa", emola: "e-Mola", numerario: "Numerário" };
                infoExtra += `<div><span>Pagamento:</span><span>${m[pedido.metodoPagamento] || pedido.metodoPagamento}</span></div>`;
            }
        }

        let botoesHTML = "";

        if (ehMesa) {
            if (pedido.estado === "novo") {
                botoesHTML = `<button class="btn-acao btn-aceitar" data-acao="em_preparacao" data-id="${pedido.id}"><i data-lucide="chef-hat"></i> Preparar</button><button class="btn-acao btn-recusar" data-acao="recusado" data-id="${pedido.id}"><i data-lucide="x"></i> Cancelar</button>`;
            } else if (pedido.estado === "em_preparacao") {
                botoesHTML = `<button class="btn-acao btn-pronto" data-acao="pronto" data-id="${pedido.id}"><i data-lucide="package"></i> Pronto</button>`;
            } else if (pedido.estado === "pronto") {
                botoesHTML = `<button class="btn-acao" style="background:rgba(168,85,247,0.2);color:#a855f7;" disabled><i data-lucide="clock"></i> Aguardar garçom servir</button>`;
            } else if (pedido.estado === "servido") {
                botoesHTML = `<button class="btn-acao btn-entregar" data-acao="pago" data-id="${pedido.id}"><i data-lucide="banknote"></i> Marcar como pago</button>`;
            } else if (pedido.estado === "pago" || pedido.estado === "recusado") {
                botoesHTML = `<button class="btn-acao btn-apagar" data-acao="apagar" data-id="${pedido.id}"><i data-lucide="trash-2"></i> Apagar</button>`;
            }
        } else {
            if (pedido.estado === "novo") {
                botoesHTML = `<button class="btn-acao btn-aceitar" data-acao="aceite" data-id="${pedido.id}"><i data-lucide="check"></i> Aceitar</button><button class="btn-acao btn-recusar" data-acao="recusado" data-id="${pedido.id}"><i data-lucide="x"></i> Recusar</button>`;
                if (pedido.tipoEntrega === "entrega") {
                    botoesHTML += `<button class="btn-acao btn-falar" data-falar="taxa" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Combinar taxa</button>`;
                }
            } else if (pedido.estado === "aceite") {
                botoesHTML = `<button class="btn-acao btn-preparar" data-acao="em_preparacao" data-id="${pedido.id}"><i data-lucide="chef-hat"></i> Preparar</button>`;
            } else if (pedido.estado === "em_preparacao") {
                botoesHTML = `<button class="btn-acao btn-pronto" data-acao="pronto" data-id="${pedido.id}"><i data-lucide="package"></i> Pronto</button>`;
            } else if (pedido.estado === "pronto") {
                if (pedido.tipoEntrega === "recolha") {
                    botoesHTML = `<button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button><button class="btn-acao btn-entregar" data-acao="entregue" data-id="${pedido.id}"><i data-lucide="check-check"></i> Entregue</button>`;
                } else {
                    if (pedido.estafetaId) {
                        botoesHTML = `<button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button><button class="btn-acao btn-caminho" data-acao="a_caminho" data-id="${pedido.id}"><i data-lucide="bike"></i> Saiu para entrega</button>`;
                    } else {
                        botoesHTML = `<button class="btn-acao btn-avisar" data-falar="pronto" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button><button class="btn-acao btn-atribuir" data-atribuir="${pedido.id}"><i data-lucide="user-plus"></i> Atribuir estafeta</button>`;
                    }
                }
            } else if (pedido.estado === "a_caminho") {
                botoesHTML = `<button class="btn-acao btn-avisar" data-falar="a_caminho" data-id="${pedido.id}"><i data-lucide="message-circle"></i> Avisar cliente</button><button class="btn-acao btn-entregar" data-acao="entregue" data-id="${pedido.id}"><i data-lucide="check-check"></i> Entregue</button>`;
            } else if (pedido.estado === "entregue" || pedido.estado === "recusado") {
                botoesHTML = `<button class="btn-acao btn-apagar" data-acao="apagar" data-id="${pedido.id}"><i data-lucide="trash-2"></i> Apagar</button>`;
            }
        }

        return `
            <article class="pedido estado-${pedido.estado} ${ehMesa ? 'pedido-mesa' : ''}" data-id="${pedido.id}">
                <div class="pedido-topo">
                    <h3>${ehMesa ? `🍽️ Mesa ${pedido.numeroMesa}` : pedido.nome}<small>${data}</small></h3>
                    <span class="pedido-estado ${pedido.estado}">${estadoTexto}</span>
                </div>
                <div class="pedido-info">
                    ${!ehMesa ? `<div><span>Telemóvel:</span><span><a href="tel:${pedido.telemovel}" style="color:var(--amarelo);">${pedido.telemovel}</a></span></div>` : ""}
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

/* AÇÕES */

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

function abrirAtribuirEstafeta(pedidoId) {
    const disponiveis = estafetasAtuais.filter(e => e.ativo !== false);
    if (disponiveis.length === 0) { alert("⚠️ Nenhum estafeta registado."); return; }
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
    } catch (erro) { console.error(erro); alert("❌ Não foi possível atribuir."); }
}

/* ESTAFETAS */

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
                    <p>${e.email || e.telemovel} · ${tipoTexto}</p>
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
        if (previewEmailEstafeta) previewEmailEstafeta.textContent = "—";
        tituloModalEstafeta.textContent = "Novo estafeta";
        modalEstafeta.hidden = false;
        setTimeout(() => document.querySelector("#estafetaNome").focus(), 100);
    });
}

document.querySelectorAll("[data-fechar-estafeta]").forEach(el => {
    el.addEventListener("click", () => { modalEstafeta.hidden = true; });
});

const estafetaNomeEl = document.querySelector("#estafetaNome");
if (estafetaNomeEl) {
    estafetaNomeEl.addEventListener("input", function () {
        const nome = this.value.trim();
        if (previewEmailEstafeta) previewEmailEstafeta.textContent = nome ? gerarEmailDoNome(nome) : "—";
    });
}

if (formEstafeta) {
    formEstafeta.addEventListener("submit", async function (e) {
        e.preventDefault();
        const id = document.querySelector("#estafetaId").value;
        const nome = document.querySelector("#estafetaNome").value.trim();
        const telemovel = document.querySelector("#estafetaTelemovel").value.replace(/\D/g, "");
        const tipo = document.querySelector("#estafetaTipo").value;
        if (!nome || !telemovel) { alert("Preencha todos os campos."); return; }
        const btnGuardar = formEstafeta.querySelector("button[type=submit]");
        const textoOriginal = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "A criar…";
        try {
            if (id) {
                await db.collection("estafetas").doc(id).update({ nome, telemovel, tipo, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
                alert(`✅ Estafeta ${nome} atualizado.`);
                modalEstafeta.hidden = true;
            } else {
                let email = gerarEmailDoNome(nome);
                let password = gerarPasswordDoNome(nome);
                let uid;
                try { uid = await criarContaUtilizador(email, password); }
                catch (err) {
                    if (err.code === "auth/email-already-in-use") {
                        email = gerarSlug(nome) + Math.floor(Math.random() * 99) + "@brasagrill.mz";
                        password = gerarPasswordDoNome(nome);
                        uid = await criarContaUtilizador(email, password);
                    } else { throw err; }
                }
                await db.collection("estafetas").doc(uid).set({
                    nome, telemovel, tipo, email, estado: "offline", ativo: true,
                    entregas_hoje: 0, ganhos_hoje: 0,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                await db.collection("roles").doc(uid).set({ role: "estafeta" });
                modalEstafeta.hidden = true;
                mostrarCredenciais(nome, email, password, telemovel, "estafeta");
            }
        } catch (erro) {
            console.error("Erro estafeta:", erro);
            alert("❌ Não foi possível criar a conta.\n\n" + (erro.message || ""));
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
            recriarIcones();
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
            document.querySelector("#estafetaTipo").value = est.tipo || "proprio";
            if (previewEmailEstafeta) previewEmailEstafeta.textContent = est.email || "—";
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
                await db.collection("estafetas").doc(est.id).update({ ativo: false, removidoEm: firebase.firestore.FieldValue.serverTimestamp() });
                alert("✅ Estafeta removido.");
            } catch (erro) { console.error(erro); alert("❌ Erro."); }
        }
    });
}

/* GARÇONS */

function renderizarGarcons() {
    if (!listaGarcons) return;
    const ativos = garconsAtuais.filter(g => g.ativo !== false);
    if (ativos.length === 0) {
        listaGarcons.innerHTML = `<div class="sem-estafetas"><i data-lucide="inbox"></i><p>Nenhum garçom registado.</p></div>`;
        recriarIcones();
        return;
    }
    listaGarcons.innerHTML = ativos.map(g => `
        <div class="estafeta-card" data-id="${g.id}">
            <div class="estafeta-card-info">
                <strong>🍽️ ${g.nome}</strong>
                <p>${g.email || g.telemovel}</p>
            </div>
            <div class="estafeta-acoes">
                <button type="button" class="btn-mini btn-editar" data-editar-garcom="${g.id}"><i data-lucide="pencil"></i></button>
                <button type="button" class="btn-mini btn-remover" data-remover-garcom="${g.id}"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join("");
    recriarIcones();
}

if (btnNovoGarcom) {
    btnNovoGarcom.addEventListener("click", function () {
        formGarcom.reset();
        document.querySelector("#garcomId").value = "";
        if (previewEmailGarcom) previewEmailGarcom.textContent = "—";
        tituloModalGarcom.textContent = "Novo garçom";
        modalGarcom.hidden = false;
        setTimeout(() => document.querySelector("#garcomNome").focus(), 100);
    });
}

document.querySelectorAll("[data-fechar-garcom]").forEach(el => {
    el.addEventListener("click", () => { modalGarcom.hidden = true; });
});

const garcomNomeEl = document.querySelector("#garcomNome");
if (garcomNomeEl) {
    garcomNomeEl.addEventListener("input", function () {
        const nome = this.value.trim();
        if (previewEmailGarcom) previewEmailGarcom.textContent = nome ? gerarEmailDoNome(nome) : "—";
    });
}

if (formGarcom) {
    formGarcom.addEventListener("submit", async function (e) {
        e.preventDefault();
        const id = document.querySelector("#garcomId").value;
        const nome = document.querySelector("#garcomNome").value.trim();
        const telemovel = document.querySelector("#garcomTelemovel").value.replace(/\D/g, "");
        if (!nome || !telemovel) { alert("Preencha todos os campos."); return; }
        const btnGuardar = formGarcom.querySelector("button[type=submit]");
        const textoOriginal = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "A criar…";
        try {
            if (id) {
                await db.collection("garcons").doc(id).update({ nome, telemovel, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() });
                alert(`✅ Garçom ${nome} atualizado.`);
                modalGarcom.hidden = true;
            } else {
                let email = gerarEmailDoNome(nome);
                let password = gerarPasswordDoNome(nome);
                let uid;
                try { uid = await criarContaUtilizador(email, password); }
                catch (err) {
                    if (err.code === "auth/email-already-in-use") {
                        email = gerarSlug(nome) + Math.floor(Math.random() * 99) + "@brasagrill.mz";
                        password = gerarPasswordDoNome(nome);
                        uid = await criarContaUtilizador(email, password);
                    } else { throw err; }
                }
                await db.collection("garcons").doc(uid).set({
                    nome, telemovel, email, ativo: true,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                await db.collection("roles").doc(uid).set({ role: "garcom" });
                modalGarcom.hidden = true;
                mostrarCredenciais(nome, email, password, telemovel, "garcom");
            }
        } catch (erro) {
            console.error("Erro garçom:", erro);
            alert("❌ Não foi possível criar a conta.\n\n" + (erro.message || ""));
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
            recriarIcones();
        }
    });
}

if (listaGarcons) {
    listaGarcons.addEventListener("click", async function (e) {
        const btnEditar = e.target.closest("[data-editar-garcom]");
        if (btnEditar) {
            const g = garconsAtuais.find(x => x.id === btnEditar.dataset.editarGarcom);
            if (!g) return;
            document.querySelector("#garcomId").value = g.id;
            document.querySelector("#garcomNome").value = g.nome || "";
            document.querySelector("#garcomTelemovel").value = g.telemovel || "";
            if (previewEmailGarcom) previewEmailGarcom.textContent = g.email || "—";
            tituloModalGarcom.textContent = "Editar garçom";
            modalGarcom.hidden = false;
            return;
        }
        const btnRemover = e.target.closest("[data-remover-garcom]");
        if (btnRemover) {
            const g = garconsAtuais.find(x => x.id === btnRemover.dataset.removerGarcom);
            if (!g) return;
            if (!confirm(`Remover ${g.nome}?`)) return;
            try {
                await db.collection("garcons").doc(g.id).update({ ativo: false, removidoEm: firebase.firestore.FieldValue.serverTimestamp() });
                alert("✅ Garçom removido.");
            } catch (erro) { console.error(erro); alert("❌ Erro."); }
        }
    });
}

/* CREDENCIAIS */

let credenciaisAtuais = null;

function mostrarCredenciais(nome, email, password, telemovel, tipo) {
    const base = "https://leonildokeysse49-creator.github.io/restaurante-brasa-grill";
    let linkLogin, titulo;
    if (tipo === "garcom") {
        linkLogin = base + "/garcom.html";
        titulo = "🍽️ Brasa Grill — Área do Garçom";
    } else if (tipo === "estafeta") {
        linkLogin = base + "/estafeta.html";
        titulo = "🛵 Brasa Delivery — Área do Estafeta";
    } else {
        linkLogin = base;
        titulo = "🔥 Brasa Grill";
    }
    credenciaisAtuais = { nome, email, password, telemovel, tipo, linkLogin, titulo };
    if (credEmail) credEmail.textContent = email;
    if (credSenha) credSenha.textContent = password;
    modalCredenciais.hidden = false;
    recriarIcones();
}

document.querySelectorAll("[data-fechar-cred]").forEach(el => {
    el.addEventListener("click", () => {
        modalCredenciais.hidden = true;
        credenciaisAtuais = null;
    });
});

if (btnCopiarCred) {
    btnCopiarCred.addEventListener("click", async function () {
        if (!credenciaisAtuais) return;
        const texto = `${credenciaisAtuais.titulo}\n\n👤 Nome: ${credenciaisAtuais.nome}\n\n📧 Email:\n${credenciaisAtuais.email}\n\n🔑 Senha:\n${credenciaisAtuais.password}\n\n🌐 Link para entrar:\n${credenciaisAtuais.linkLogin}`;
        try {
            await navigator.clipboard.writeText(texto);
            btnCopiarCred.innerHTML = '<i data-lucide="check"></i> Copiado!';
            recriarIcones();
            setTimeout(() => {
                btnCopiarCred.innerHTML = '<i data-lucide="copy"></i> Copiar credenciais';
                recriarIcones();
            }, 2000);
        } catch (e) {
            alert("❌ Não foi possível copiar.");
        }
    });
}

if (btnWhatsCred) {
    btnWhatsCred.addEventListener("click", function () {
        if (!credenciaisAtuais) return;
        let tel = credenciaisAtuais.telemovel.replace(/\D/g, "");
        if (!tel.startsWith("258")) tel = "258" + tel;
        const msg = 
`Olá ${credenciaisAtuais.nome}! 👋

Aqui estão as tuas credenciais de acesso:

${credenciaisAtuais.titulo}

📧 Email:
${credenciaisAtuais.email}

🔑 Senha:
${credenciaisAtuais.password}

🌐 Link para entrar:
${credenciaisAtuais.linkLogin}

💡 Dica: Abre o link no Chrome e adiciona ao ecrã inicial para ficares com um ícone direto.

Bom trabalho! 🔥`;
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    });
}

/* FILTROS */

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

window.addEventListener("load", recriarIcones);