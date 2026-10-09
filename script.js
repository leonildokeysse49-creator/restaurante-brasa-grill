/* =========================================================
   BRASA GRILL — SCRIPT.JS
   Produtos agrupados por categoria + Lucide icons
   ========================================================= */


/* =========================================================
   1. CONFIGURAÇÕES
   ========================================================= */

const CONFIG = {
    whatsapp: "258853217149",
    email: "leonildokeysse49@gmail.com",
    nomeLoja: "Brasa Grill",
    localizacao: "Alto Maé",
    horario: "Todos os dias: 7h às 23h",
    formspree: "https://formspree.io/f/xrpeqoje"
};


/* =========================================================
   2. ORDEM DAS CATEGORIAS
   ========================================================= */

const ORDEM_CATEGORIAS = [
    { id: "promocao",  titulo: "Promoções",         icone: "gift" },
    { id: "burger",    titulo: "Burgers",           icone: "sandwich" },
    { id: "pizza",     titulo: "Pizzas",            icone: "pizza" },
    { id: "frango",    titulo: "Frango & Asinhas",  icone: "drumstick" },
    { id: "sandes",    titulo: "Sandes & Tostas",   icone: "utensils" },
    { id: "prego",     titulo: "Prego, Rolls & Wrap", icone: "hot-dog" },
    { id: "batata",    titulo: "Batata & Extras",   icone: "fries" },
    { id: "bebidas",   titulo: "Bebidas",           icone: "cup-soda" },
    { id: "sobremesa", titulo: "Sobremesas",        icone: "ice-cream-cone" }
];


/* =========================================================
   3. ESTADO
   ========================================================= */

const estado = {
    categoria: "todos",
    pesquisa: "",
    carrinho: []
};


/* =========================================================
   4. ELEMENTOS DO HTML
   ========================================================= */

const catalogoHTML = document.querySelector("#catalogo");
const pesquisaHTML = document.querySelector("#pesquisa");
const categoriasHTML = document.querySelector("#categorias");
const btnCarrinho = document.querySelector("#btnCarrinho");
const contadorCarrinho = document.querySelector("#contadorCarrinho");
const carrinhoHTML = document.querySelector("#carrinho");
const itensCarrinhoHTML = document.querySelector("#itensCarrinho");
const totalCarrinhoHTML = document.querySelector("#totalCarrinho");
const btnWhatsApp = document.querySelector("#btnWhatsApp");
const btnLimpar = document.querySelector("#btnLimpar");
const btnFecharCarrinho = document.querySelector("#btnFecharCarrinho");
const btnVoltar = document.querySelector("#btnVoltar");
const anoAtualHTML = document.querySelector("#anoAtual");
const formContacto = document.querySelector("#formContacto");


/* =========================================================
   5. FORMATAR PREÇO
   ========================================================= */

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-MZ").format(valor) + " MT";
}


/* =========================================================
   6. RECRIAR ÍCONES LUCIDE
   ========================================================= */

function recriarIcones() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


/* =========================================================
   7. OBTER PRODUTOS POR CATEGORIA
   ========================================================= */

function obterProdutosPorCategoria() {

    const termo = estado.pesquisa.trim().toLowerCase();

    if (termo !== "") {

        const encontrados = catalogo.filter(produto =>
            produto.nome.toLowerCase().includes(termo) ||
            produto.descricao.toLowerCase().includes(termo) ||
            produto.categoria.toLowerCase().includes(termo)
        );

        return encontrados.length > 0
            ? [{ id: "resultado", titulo: `Resultados para "${estado.pesquisa}"`, icone: "search", produtos: encontrados }]
            : [];

    }

    if (estado.categoria !== "todos") {

        const categoria = ORDEM_CATEGORIAS.find(c => c.id === estado.categoria);

        if (!categoria) return [];

        const produtos = catalogo.filter(p => p.categoria === estado.categoria);

        return produtos.length > 0
            ? [{ id: categoria.id, titulo: categoria.titulo, icone: categoria.icone, produtos }]
            : [];

    }

    return ORDEM_CATEGORIAS
        .map(cat => ({
            id: cat.id,
            titulo: cat.titulo,
            icone: cat.icone,
            produtos: catalogo.filter(p => p.categoria === cat.id)
        }))
        .filter(grupo => grupo.produtos.length > 0);

}


/* =========================================================
   8. MOSTRAR CATÁLOGO
   ========================================================= */

function mostrarProdutos() {

    const grupos = obterProdutosPorCategoria();

    if (grupos.length === 0) {

        catalogoHTML.innerHTML = `
            <div class="sem-produtos">
                <h3>Nenhum produto encontrado</h3>
                <p>Tente pesquisar outro produto ou escolher outra categoria.</p>
            </div>
        `;

        recriarIcones();
        return;

    }

    catalogoHTML.innerHTML = grupos.map(grupo => `

        <section class="categoria-bloco">

            <h3 class="categoria-titulo">
                <i data-lucide="${grupo.icone}"></i>
                ${grupo.titulo}
            </h3>

            <div class="categoria-grelha">

                ${grupo.produtos.map(produto => `

                    <article class="produto" data-id="${produto.id}">

                        <div class="produto-conteudo">

                            <h4 class="produto-nome">
                                ${produto.nome}
                            </h4>

                            <p class="produto-descricao">
                                ${produto.descricao}
                            </p>

                            <div class="produto-footer">

                                <strong class="produto-preco">
                                    ${formatarPreco(produto.preco)}
                                </strong>

                                <div class="produto-acoes">

                                    <button
                                        type="button"
                                        class="btn-pedir"
                                        data-pedir="${produto.id}"
                                        aria-label="Pedir agora ${produto.nome} pelo WhatsApp"
                                    >
                                        <i data-lucide="message-circle"></i>
                                        Pedir agora
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-adicionar"
                                        data-adicionar="${produto.id}"
                                        aria-label="Adicionar ${produto.nome} ao pedido"
                                    >
                                        <i data-lucide="shopping-cart"></i>
                                        Adicionar ao pedido
                                    </button>

                                </div>

                            </div>

                        </div>

                    </article>

                `).join("")}

            </div>

        </section>

    `).join("");

    recriarIcones();

}


/* =========================================================
   9. SELECIONAR CATEGORIA
   ========================================================= */

function selecionarCategoria(categoria) {
    estado.categoria = categoria;
    estado.pesquisa = "";
    pesquisaHTML.value = "";
    mostrarProdutos();
    atualizarBotoesCategoria();
}


/* =========================================================
   10. ATUALIZAR BOTÕES DE CATEGORIA
   ========================================================= */

function atualizarBotoesCategoria() {

    const botoes = categoriasHTML.querySelectorAll("[data-categoria]");

    botoes.forEach(botao => {

        const selecionado =
            botao.dataset.categoria.toLowerCase() === estado.categoria.toLowerCase();

        botao.classList.toggle("ativo", selecionado);
        botao.setAttribute("aria-pressed", selecionado);

    });

}


/* =========================================================
   11. ADICIONAR AO CARRINHO
   ========================================================= */

function adicionarAoCarrinho(id) {

    const produto = catalogo.find(item => item.id === id);
    if (!produto) return;

    const existente = estado.carrinho.find(item => item.id === id);

    if (existente) {
        existente.quantidade++;
    } else {
        estado.carrinho.push({ ...produto, quantidade: 1 });
    }

    atualizarCarrinho();
    abrirCarrinho();

}


/* =========================================================
   12. PEDIR AGORA (produto único → WhatsApp)
   ========================================================= */

function pedirAgora(id) {

    const produto = catalogo.find(item => item.id === id);
    if (!produto) return;

    const mensagem = [
        "*PEDIDO — BRASA GRILL*",
        "",
        "*Produto:*",
        `- 1x ${produto.nome} — ${formatarPreco(produto.preco)}`,
        "",
        "Olá! Gostaria de encomendar este produto."
    ].join("\n");

    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");

}


/* =========================================================
   13. ALTERAR QUANTIDADE
   ========================================================= */

function alterarQuantidade(id, delta) {

    const item = estado.carrinho.find(p => p.id === id);
    if (!item) return;

    item.quantidade += delta;

    if (item.quantidade <= 0) {
        removerDoCarrinho(id);
        return;
    }

    atualizarCarrinho();

}


/* =========================================================
   14. REMOVER
   ========================================================= */

function removerDoCarrinho(id) {
    estado.carrinho = estado.carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
}


/* =========================================================
   15. CÁLCULOS
   ========================================================= */

function calcularTotal() {
    return estado.carrinho.reduce((t, i) => t + i.preco * i.quantidade, 0);
}

function calcularQuantidadeTotal() {
    return estado.carrinho.reduce((t, i) => t + i.quantidade, 0);
}


/* =========================================================
   16. ATUALIZAR CARRINHO
   ========================================================= */

function atualizarCarrinho() {

    contadorCarrinho.textContent = calcularQuantidadeTotal();
    totalCarrinhoHTML.textContent = formatarPreco(calcularTotal());

    if (estado.carrinho.length === 0) {

        itensCarrinhoHTML.innerHTML = `
            <div class="carrinho-vazio">
                <h3>O seu pedido está vazio</h3>
                <p>Adicione produtos do nosso menu.</p>
            </div>
        `;

        recriarIcones();
        return;

    }

    itensCarrinhoHTML.innerHTML = estado.carrinho.map(item => `

        <div class="item-carrinho" data-id="${item.id}">

            <div>
                <strong>${item.nome}</strong>
                <p>${formatarPreco(item.preco)} cada</p>
            </div>

            <div class="quantidade">

                <button type="button" data-diminuir="${item.id}"
                        aria-label="Diminuir quantidade">
                    <i data-lucide="minus"></i>
                </button>

                <span>${item.quantidade}</span>

                <button type="button" data-aumentar="${item.id}"
                        aria-label="Aumentar quantidade">
                    <i data-lucide="plus"></i>
                </button>

            </div>

            <div class="item-acoes">

                <button type="button" class="btn-pedir-item" data-pedir-item="${item.id}"
                        aria-label="Pedir agora ${item.nome} pelo WhatsApp">
                    <i data-lucide="message-circle"></i>
                    Pedir agora
                </button>

                <button type="button" class="btn-remover" data-remover="${item.id}"
                        aria-label="Remover produto">
                    <i data-lucide="trash-2"></i>
                    Remover
                </button>

            </div>

        </div>

    `).join("");

    recriarIcones();

}


/* =========================================================
   17. ABRIR / FECHAR CARRINHO
   ========================================================= */

function abrirCarrinho()  { carrinhoHTML.hidden = false; }
function fecharCarrinho() { carrinhoHTML.hidden = true;  }


/* =========================================================
   18. LIMPAR
   ========================================================= */

function limparCarrinho() {
    estado.carrinho = [];
    atualizarCarrinho();
}


/* =========================================================
   19. MENSAGEM WHATSAPP (carrinho completo)
   ========================================================= */

function criarMensagemWhatsApp() {

    const linhas = estado.carrinho.map(item => {
        const subtotal = item.preco * item.quantidade;
        return `- ${item.quantidade}x ${item.nome} — ${formatarPreco(subtotal)}`;
    });

    return [
        "*NOVO PEDIDO — BRASA GRILL*",
        "",
        "*Produtos:*",
        ...linhas,
        "",
        `*TOTAL: ${formatarPreco(calcularTotal())}*`,
        "",
        "Olá! Gostaria de fazer este pedido."
    ].join("\n");

}


/* =========================================================
   20. ENVIAR WHATSAPP (carrinho completo)
   ========================================================= */

function enviarParaWhatsApp() {

    if (estado.carrinho.length === 0) {
        alert("Adicione pelo menos um produto ao pedido.");
        return;
    }

    const mensagem = criarMensagemWhatsApp();
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");

}


/* =========================================================
   21. FORMULÁRIO DE CONTACTO (Formspree + WhatsApp)
   ========================================================= */

/* Enviar para o Formspree (email) */
async function enviarPorEmail(dados) {

    const botao = document.querySelector('[data-enviar="email"]');
    const textoOriginal = botao.innerHTML;

    try {

        botao.disabled = true;
        botao.innerHTML = "A enviar…";

        const resposta = await fetch(CONFIG.formspree, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: dados.nome,
                email: dados.email,
                telefone: dados.telefone,
                assunto: dados.assunto,
                mensagem: dados.mensagem,
                _replyto: dados.email !== "—" ? dados.email : undefined,
                _subject: `[Brasa Grill] ${dados.assunto}`
            })
        });

        if (resposta.ok) {

            alert("✅ Mensagem enviada com sucesso! Entraremos em contacto brevemente.");
            document.querySelector("#formContacto").reset();

        } else {

            const erro = await resposta.json();
            console.error("Erro Formspree:", erro);

            alert("❌ Não foi possível enviar a mensagem. Tente novamente ou envie pelo WhatsApp.");

        }

    } catch (e) {

        console.error("Erro de rede:", e);
        alert("❌ Erro de ligação. Verifique a sua internet e tente novamente.");

    } finally {

        botao.disabled = false;
        botao.innerHTML = textoOriginal;
        recriarIcones();

    }

}


/* Enviar para WhatsApp */
function enviarPorWhatsAppForm(dados) {

    const texto = [
        "*NOVA MENSAGEM — BRASA GRILL*",
        "",
        `*Nome:* ${dados.nome}`,
        dados.email && dados.email !== "—" ? `*Email:* ${dados.email}` : null,
        dados.telefone && dados.telefone !== "—" ? `*Telefone:* ${dados.telefone}` : null,
        `*Assunto:* ${dados.assunto}`,
        "",
        "*Mensagem:*",
        dados.mensagem
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

}


/* Recolher dados + decidir envio */
function enviarFormulario(tipo) {

    const nome = document.querySelector("#nome").value.trim();
    const email = document.querySelector("#emailForm").value.trim();
    const telefone = document.querySelector("#telefoneForm").value.trim();
    const assunto = document.querySelector("#assunto").value;
    const mensagem = document.querySelector("#mensagem").value.trim();

    if (!nome || !assunto || !mensagem) {
        alert("Por favor, preencha o nome, o assunto e a mensagem.");
        return;
    }

    const dados = {
        nome,
        email: email || "—",
        telefone: telefone || "—",
        assunto,
        mensagem
    };

    if (tipo === "whatsapp") {
        enviarPorWhatsAppForm(dados);
    } else {
        enviarPorEmail(dados);
    }

}


/* =========================================================
   22. EVENTOS
   ========================================================= */

pesquisaHTML.addEventListener("input", function () {

    estado.pesquisa = pesquisaHTML.value;

    if (estado.pesquisa !== "") {
        estado.categoria = "todos";
        atualizarBotoesCategoria();
    }

    mostrarProdutos();

});


categoriasHTML.addEventListener("click", function (e) {

    const botao = e.target.closest("[data-categoria]");
    if (!botao) return;

    selecionarCategoria(botao.dataset.categoria);

});


catalogoHTML.addEventListener("click", function (e) {

    const btnPedir = e.target.closest("[data-pedir]");
    if (btnPedir) { pedirAgora(btnPedir.dataset.pedir); return; }

    const btnAdicionar = e.target.closest("[data-adicionar]");
    if (btnAdicionar) { adicionarAoCarrinho(btnAdicionar.dataset.adicionar); }

});


itensCarrinhoHTML.addEventListener("click", function (e) {

    const aumentar = e.target.closest("[data-aumentar]");
    if (aumentar) { alterarQuantidade(aumentar.dataset.aumentar, 1); return; }

    const diminuir = e.target.closest("[data-diminuir]");
    if (diminuir) { alterarQuantidade(diminuir.dataset.diminuir, -1); return; }

    const pedirItem = e.target.closest("[data-pedir-item]");
    if (pedirItem) { pedirAgora(pedirItem.dataset.pedirItem); return; }

    const remover = e.target.closest("[data-remover]");
    if (remover) { removerDoCarrinho(remover.dataset.remover); }

});


btnCarrinho.addEventListener("click", function () {
    carrinhoHTML.hidden ? abrirCarrinho() : fecharCarrinho();
});


btnFecharCarrinho.addEventListener("click", fecharCarrinho);
btnVoltar.addEventListener("click", fecharCarrinho);
btnWhatsApp.addEventListener("click", enviarParaWhatsApp);
btnLimpar.addEventListener("click", limparCarrinho);


// Formulário de contacto
if (formContacto) {

    formContacto.addEventListener("click", function (e) {

        const btn = e.target.closest("[data-enviar]");
        if (!btn) return;

        e.preventDefault();
        enviarFormulario(btn.dataset.enviar);

    });

}


/* =========================================================
   23. ANO ATUAL
   ========================================================= */

if (anoAtualHTML) {
    anoAtualHTML.textContent = new Date().getFullYear();
}


/* =========================================================
   24. INICIAR
   ========================================================= */

function iniciarSite() {
    console.log("Brasa Grill iniciado!");
    console.log("Produtos:", catalogo.length);
    mostrarProdutos();
    atualizarCarrinho();
    atualizarBotoesCategoria();
    recriarIcones();
}

iniciarSite();