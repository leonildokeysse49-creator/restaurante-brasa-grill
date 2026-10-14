/* =========================================================
   BRASA GRILL — PAINEL DO GARÇOM (FIREBASE AUTH)
   ========================================================= */

const TOTAL_MESAS = 20;

let garcomAtual = null;
let pedidosMesa = [];
let unsubscribePedidos = null;

let mesaAberta = null;
let pedidoMesaAberta = null;
let carrinho = [];
let categoriaAtual = "todos";
let pesquisaAtual = "";


/* ELEMENTOS */

const ecraLogin = document.querySelector("#ecraLogin");
const painel = document.querySelector("#painel");
const formLogin = document.querySelector("#formLogin");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const erroLogin = document.querySelector("#erroLogin");
const nomeGarcom = document.querySelector("#nomeGarcom");
const btnSair = document.querySelector("#btnSair");
const indicadorLigacao = document.querySelector("#indicadorLigacao");
const grelhaMesas = document.querySelector("#grelhaMesas");
const totalMesas = document.querySelector("#totalMesas");
const totalVendas = document.querySelector("#totalVendas");

const modalMesa = document.querySelector("#modalMesa");
const tituloMesa = document.querySelector("#tituloMesa");
const estadoMesa = document.querySelector("#estadoMesa");
const listaProdutosMesa = document.querySelector("#listaProdutosMesa");
const totalMesaEl = document.querySelector("#totalMesa");
const btnAdicionarProdutos = document.querySelector("#btnAdicionarProdutos");
const btnEnviarCozinha = document.querySelector("#btnEnviarCozinha");
const btnServir = document.querySelector("#btnServir");
const btnFecharMesa = document.querySelector("#btnFecharMesa");

const modalCardapio = document.querySelector("#modalCardapio");
const pesquisaProdutos = document.querySelector("#pesquisaProdutos");
const cardapioCategorias = document.querySelector("#cardapioCategorias");
const cardapioLista = document.querySelector("#cardapioLista");
const contadorCarrinho = document.querySelector("#contadorCarrinho");
const totalCarrinho = document.querySelector("#totalCarrinho");
const btnConfirmarCarrinho = document.querySelector("#btnConfirmarCarrinho");


/* AUXILIARES */

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-MZ").format(valor) + " MT";
}

function recriarIcones() {
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function calcularTempoDecorrido(timestamp) {
    if (!timestamp) return "";
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const minutos = Math.floor((Date.now() - data.getTime()) / 60000);
    if (minutos < 60) return `${minutos}min`;
    return `${Math.floor(minutos / 60)}h${minutos % 60}min`;
}


/* LOGIN COM FIREBASE AUTH */

formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    erroLogin.hidden = true;

    try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
        const role = await obterRole(cred.user);

        if (role !== "garcom") {
            await firebase.auth().signOut();
            erroLogin.textContent = "❌ Não tens permissão de garçom.";
            erroLogin.hidden = false;
            return;
        }

        garcomAtual = {
            id: cred.user.uid,
            nome: cred.user.displayName || email.split("@")[0],
            email: cred.user.email
        };

        iniciarPainel();

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


/* VERIFICAR SESSÃO AO ABRIR */

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user || user.isAnonymous) {
        ecraLogin.hidden = false;
        painel.hidden = true;
        setTimeout(() => emailInput?.focus(), 100);
        recriarIcones();
        return;
    }

    try {
        const role = await obterRole(user);

        if (role !== "garcom") {
            ecraLogin.hidden = false;
            painel.hidden = true;
            return;
        }

        garcomAtual = {
            id: user.uid,
            nome: user.displayName || user.email.split("@")[0],
            email: user.email
        };

        iniciarPainel();

    } catch (e) {
        console.error(e);
    }
});


/* INICIAR PAINEL */

function iniciarPainel() {
    ecraLogin.hidden = true;
    painel.hidden = false;
    nomeGarcom.textContent = garcomAtual.nome;
    escutarPedidosMesa();
    recriarIcones();
}

function escutarPedidosMesa() {
    if (unsubscribePedidos) unsubscribePedidos();

    unsubscribePedidos = db.collection("pedidos")
        .where("tipoPedido", "==", "mesa")
        .orderBy("criadoEm", "desc")
        .limit(100)
        .onSnapshot(snapshot => {
            indicadorLigacao.innerHTML = '<i data-lucide="wifi"></i> Em direto';
            indicadorLigacao.classList.remove("offline");

            pedidosMesa = [];
            snapshot.forEach(doc => {
                const dados = doc.data();
                if (dados.estado !== "pago" && dados.estado !== "recusado") {
                    pedidosMesa.push({ id: doc.id, ...dados });
                }
            });

            renderizarMesas();
            atualizarResumo();

        }, erro => {
            console.error("Erro Firestore:", erro);
            indicadorLigacao.innerHTML = '<i data-lucide="wifi-off"></i> Sem ligação';
            indicadorLigacao.classList.add("offline");
        });
}


/* RESUMO */

async function atualizarResumo() {
    totalMesas.textContent = pedidosMesa.length;

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    try {
        const snap = await db.collection("pedidos")
            .where("tipoPedido", "==", "mesa")
            .where("estado", "==", "pago")
            .where("criadoEm", ">=", inicioHoje)
            .get();

        let total = 0;
        snap.forEach(doc => total += (doc.data().total || 0));
        totalVendas.textContent = formatarPreco(total);
    } catch (e) {
        console.warn("Erro ao calcular vendas:", e);
        totalVendas.textContent = "0 MT";
    }
}


/* GRELHA DE MESAS */

function renderizarMesas() {
    if (!grelhaMesas) return;

    const mesasHTML = [];

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        const pedido = pedidosMesa.find(p => p.numeroMesa === i);

        let estado = "livre";
        let total = 0;
        let tempo = "";

        if (pedido) {
            if (pedido.estado === "servido") {
                estado = "a_pagar";
            } else {
                estado = "ocupada";
            }
            total = pedido.total || 0;
            tempo = calcularTempoDecorrido(pedido.criadoEm);
        }

        mesasHTML.push(`
            <div class="mesa-card ${estado}" data-mesa="${i}">
                <div class="mesa-numero">${i}</div>
                <div class="mesa-estado">
                    ${estado === "livre" ? "Livre" : estado === "ocupada" ? "Ocupada" : "A pagar"}
                </div>
                ${total > 0 ? `<span class="mesa-total">${formatarPreco(total)}</span>` : ""}
                ${tempo ? `<span class="mesa-tempo">${tempo}</span>` : ""}
            </div>
        `);
    }

    grelhaMesas.innerHTML = mesasHTML.join("");
    recriarIcones();
}

grelhaMesas.addEventListener("click", function (e) {
    const card = e.target.closest("[data-mesa]");
    if (!card) return;
    const numero = parseInt(card.dataset.mesa);
    abrirMesa(numero);
});

function abrirMesa(numero) {
    mesaAberta = numero;
    pedidoMesaAberta = pedidosMesa.find(p => p.numeroMesa === numero) || null;

    tituloMesa.innerHTML = `<i data-lucide="utensils"></i> Mesa ${numero}`;

    renderizarDetalheMesa();
    modalMesa.hidden = false;
    recriarIcones();
}

function renderizarDetalheMesa() {
    if (!pedidoMesaAberta) {
        estadoMesa.className = "estado-mesa estado-novo";
        estadoMesa.innerHTML = `<i data-lucide="circle"></i> Mesa livre — pronta para abrir`;
        listaProdutosMesa.innerHTML = `<li class="sem-itens">Nenhum produto ainda.</li>`;
        totalMesaEl.textContent = "0 MT";
        btnAdicionarProdutos.innerHTML = `<i data-lucide="plus"></i> Abrir mesa e adicionar produtos`;
        btnAdicionarProdutos.hidden = false;
        btnEnviarCozinha.hidden = true;
        btnServir.hidden = true;
        btnFecharMesa.hidden = true;
    } else {
        const estadoTexto = {
            novo: "🆕 Aguardando envio para cozinha",
            em_preparacao: "👨‍🍳 Em preparação na cozinha",
            pronto: "📦 Pronto a servir",
            servido: "✅ Servido — aguardando pagamento"
        }[pedidoMesaAberta.estado] || pedidoMesaAberta.estado;

        estadoMesa.className = `estado-mesa estado-${pedidoMesaAberta.estado}`;
        estadoMesa.innerHTML = `<i data-lucide="info"></i> ${estadoTexto}`;

        if (pedidoMesaAberta.produtos && pedidoMesaAberta.produtos.length > 0) {
            listaProdutosMesa.innerHTML = pedidoMesaAberta.produtos.map(p => `
                <li>
                    <span>${p.quantidade}× ${p.nome}</span>
                    <span>${formatarPreco(p.subtotal || p.preco * p.quantidade)}</span>
                </li>
            `).join("");
        } else {
            listaProdutosMesa.innerHTML = `<li class="sem-itens">Nenhum produto ainda.</li>`;
        }

        totalMesaEl.textContent = formatarPreco(pedidoMesaAberta.total || 0);

        btnAdicionarProdutos.innerHTML = `<i data-lucide="plus"></i> Adicionar mais produtos`;
        btnAdicionarProdutos.hidden = false;

        btnEnviarCozinha.hidden = pedidoMesaAberta.estado !== "novo";
        btnServir.hidden = pedidoMesaAberta.estado !== "pronto";
        btnFecharMesa.hidden = pedidoMesaAberta.estado !== "servido";
    }

    recriarIcones();
}


/* FECHAR MODAL MESA */

document.querySelectorAll("[data-fechar-modal]").forEach(el => {
    el.addEventListener("click", () => {
        modalMesa.hidden = true;
        mesaAberta = null;
        pedidoMesaAberta = null;
    });
});


/* ENVIAR PARA COZINHA */

btnEnviarCozinha.addEventListener("click", async function () {
    if (!pedidoMesaAberta) return;
    try {
        await db.collection("pedidos").doc(pedidoMesaAberta.id).update({
            estado: "em_preparacao",
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error(e);
        alert("❌ Erro ao enviar para cozinha.");
    }
});


/* SERVIR NA MESA */

btnServir.addEventListener("click", async function () {
    if (!pedidoMesaAberta) return;
    if (!confirm("Confirmar que os produtos foram servidos na mesa?")) return;
    try {
        await db.collection("pedidos").doc(pedidoMesaAberta.id).update({
            estado: "servido",
            servidoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error(e);
        alert("❌ Erro ao marcar como servido.");
    }
});


/* FECHAR MESA (PAGO) */

btnFecharMesa.addEventListener("click", async function () {
    if (!pedidoMesaAberta) return;
    const total = formatarPreco(pedidoMesaAberta.total || 0);
    if (!confirm(`Confirmar pagamento de ${total}?\n\nA mesa será fechada.`)) return;

    try {
        await db.collection("pedidos").doc(pedidoMesaAberta.id).update({
            estado: "pago",
            pagoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        modalMesa.hidden = true;
        mesaAberta = null;
        pedidoMesaAberta = null;
    } catch (e) {
        console.error(e);
        alert("❌ Erro ao fechar mesa.");
    }
});


/* ABRIR CARDÁPIO */

btnAdicionarProdutos.addEventListener("click", function () {
    carrinho = [];
    categoriaAtual = "todos";
    pesquisaAtual = "";
    if (pesquisaProdutos) pesquisaProdutos.value = "";
    renderizarCategorias();
    renderizarCardapio();
    atualizarCarrinhoUI();
    modalCardapio.hidden = false;
    recriarIcones();
});

document.querySelectorAll("[data-fechar-cardapio]").forEach(el => {
    el.addEventListener("click", () => {
        modalCardapio.hidden = true;
        carrinho = [];
    });
});


/* CATEGORIAS */

function renderizarCategorias() {
    const categorias = [
        { id: "todos", titulo: "Todos" },
        { id: "promocao", titulo: "Promoções" },
        { id: "burger", titulo: "Burgers" },
        { id: "pizza", titulo: "Pizzas" },
        { id: "frango", titulo: "Frango" },
        { id: "sandes", titulo: "Sandes" },
        { id: "prego", titulo: "Prego" },
        { id: "batata", titulo: "Batata" },
        { id: "bebidas", titulo: "Bebidas" },
        { id: "sobremesa", titulo: "Sobremesas" }
    ];

    cardapioCategorias.innerHTML = categorias.map(c => `
        <button type="button" class="btn-cat ${c.id === categoriaAtual ? "ativo" : ""}" data-cat="${c.id}">
            ${c.titulo}
        </button>
    `).join("");
}

cardapioCategorias.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    categoriaAtual = btn.dataset.cat;
    renderizarCategorias();
    renderizarCardapio();
});


/* PESQUISA */

if (pesquisaProdutos) {
    pesquisaProdutos.addEventListener("input", function () {
        pesquisaAtual = this.value.trim().toLowerCase();
        renderizarCardapio();
    });
}


/* CARDÁPIO */

function renderizarCardapio() {
    let lista = catalogo;

    if (categoriaAtual !== "todos") {
        lista = lista.filter(p => p.categoria === categoriaAtual);
    }

    if (pesquisaAtual) {
        lista = lista.filter(p =>
            p.nome.toLowerCase().includes(pesquisaAtual) ||
            p.descricao.toLowerCase().includes(pesquisaAtual)
        );
    }

    if (lista.length === 0) {
        cardapioLista.innerHTML = `<p style="text-align:center;color:var(--texto-secundario);padding:20px;">Nenhum produto encontrado.</p>`;
        return;
    }

    cardapioLista.innerHTML = lista.map(produto => {
        const itemCarrinho = carrinho.find(i => i.id === produto.id);
        const qtd = itemCarrinho ? itemCarrinho.quantidade : 0;

        return `
            <div class="produto-item ${qtd > 0 ? "no-carrinho" : ""}" data-produto="${produto.id}">
                <div class="produto-item-info">
                    <strong>${produto.nome}</strong>
                    <span>${formatarPreco(produto.preco)}</span>
                </div>
                <div class="produto-item-controles">
                    ${qtd > 0 ? `
                        <button type="button" class="btn-controle" data-diminuir="${produto.id}">
                            <i data-lucide="minus"></i>
                        </button>
                        <span class="qtd-produto">${qtd}</span>
                    ` : ""}
                    <button type="button" class="btn-controle" data-aumentar="${produto.id}">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    recriarIcones();
}


/* CARRINHO */

cardapioLista.addEventListener("click", function (e) {
    const btnAumentar = e.target.closest("[data-aumentar]");
    if (btnAumentar) { adicionarAoCarrinho(btnAumentar.dataset.aumentar); return; }
    const btnDiminuir = e.target.closest("[data-diminuir]");
    if (btnDiminuir) { removerDoCarrinho(btnDiminuir.dataset.diminuir); }
});

function adicionarAoCarrinho(id) {
    const produto = catalogo.find(p => p.id === id);
    if (!produto) return;
    const existente = carrinho.find(i => i.id === id);
    if (existente) existente.quantidade++;
    else carrinho.push({ ...produto, quantidade: 1 });
    renderizarCardapio();
    atualizarCarrinhoUI();
}

function removerDoCarrinho(id) {
    const item = carrinho.find(i => i.id === id);
    if (!item) return;
    item.quantidade--;
    if (item.quantidade <= 0) carrinho = carrinho.filter(i => i.id !== id);
    renderizarCardapio();
    atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
    const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const qtd = carrinho.reduce((s, i) => s + i.quantidade, 0);
    contadorCarrinho.textContent = qtd;
    totalCarrinho.textContent = formatarPreco(total);
}


/* CONFIRMAR CARRINHO */

btnConfirmarCarrinho.addEventListener("click", async function () {
    if (carrinho.length === 0) {
        alert("Adicione pelo menos um produto.");
        return;
    }

    const novosProdutos = carrinho.map(i => ({
        id: i.id, nome: i.nome, preco: i.preco,
        quantidade: i.quantidade, subtotal: i.preco * i.quantidade
    }));

    const totalNovos = novosProdutos.reduce((s, p) => s + p.subtotal, 0);

    try {
        if (pedidoMesaAberta) {
            const produtosExistentes = pedidoMesaAberta.produtos || [];
            const produtosFinais = [...produtosExistentes, ...novosProdutos];
            const novoTotal = produtosFinais.reduce((s, p) => s + (p.subtotal || p.preco * p.quantidade), 0);
            const novaQtd = produtosFinais.reduce((s, p) => s + p.quantidade, 0);

            await db.collection("pedidos").doc(pedidoMesaAberta.id).update({
                produtos: produtosFinais,
                subtotal: novoTotal,
                total: novoTotal,
                quantidade: novaQtd,
                estado: "novo",
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const novoPedido = {
                tipoPedido: "mesa",
                numeroMesa: mesaAberta,
                garcomId: garcomAtual.id,
                garcomNome: garcomAtual.nome,
                produtos: novosProdutos,
                subtotal: totalNovos,
                total: totalNovos,
                quantidade: novosProdutos.reduce((s, p) => s + p.quantidade, 0),
                estado: "novo",
                origem: "garcom",
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("pedidos").add(novoPedido);
        }

        modalCardapio.hidden = true;
        carrinho = [];

        setTimeout(() => {
            if (mesaAberta) {
                pedidoMesaAberta = pedidosMesa.find(p => p.numeroMesa === mesaAberta) || null;
                renderizarDetalheMesa();
            }
        }, 800);

    } catch (e) {
        console.error("Erro ao guardar pedido:", e);
        alert("❌ Erro ao guardar pedido. Tente novamente.");
    }
});


/* SAIR */

if (btnSair) {
    btnSair.addEventListener("click", async function () {
        if (!confirm("Quer sair?")) return;
        if (unsubscribePedidos) unsubscribePedidos();
        try { await firebase.auth().signOut(); } catch (e) { console.warn(e); }
        location.reload();
    });
}


/* INICIAR */

window.addEventListener("load", recriarIcones);