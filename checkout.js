/* =========================================================
   BRASA GRILL — CHECKOUT COM ENTREGA/RECOLHA
   ========================================================= */


/* =========================================================
   1. ELEMENTOS
   ========================================================= */

const modalCheckout = document.querySelector("#modalCheckout");
const modalTotal = document.querySelector("#modalTotal");
const formCheckout = document.querySelector("#formCheckout");
const btnFinalizar = document.querySelector("#btnFinalizar");
const secaoMorada = document.querySelector("#secaoMorada");
const selectZona = document.querySelector("#checkoutZona");
const resumoTaxa = document.querySelector("#resumoTaxa");
const inputMorada = document.querySelector("#checkoutMorada");

let taxaEntregaCalculada = 0;
let tipoEntregaAtual = "entrega";


/* =========================================================
   2. POPULAR O DROPDOWN DE ZONAS
   ========================================================= */

function popularZonas() {

    if (!selectZona) return;

    // Verificar se o ficheiro zonas.js foi carregado
    if (typeof listarZonas !== "function") {
        console.warn("⚠️ zonas.js não carregado — a usar zonas padrão");
        return;
    }

    const zonas = listarZonas();

    selectZona.innerHTML = `
        <option value="">Escolha a sua zona…</option>
        ${zonas.map(z => `
            <option value="${z.id}">
                ${z.nome} — a partir de ${z.taxaBase} MT
            </option>
        `).join("")}
    `;

}


/* =========================================================
   3. ABRIR / FECHAR MODAL
   ========================================================= */

function abrirCheckout() {

    if (estado.carrinho.length === 0) {
        alert("Adicione pelo menos um produto ao pedido.");
        return;
    }

    const subtotal = calcularTotal();

    modalTotal.textContent = formatarPreco(subtotal);

    document.querySelector("#resumoSubtotal").textContent = formatarPreco(subtotal);
    document.querySelector("#resumoTotal").textContent = formatarPreco(subtotal);

    modalCheckout.hidden = false;
    document.body.style.overflow = "hidden";

    popularZonas();
    recriarIcones();

    setTimeout(() => {
        document.querySelector("#checkoutNome")?.focus();
    }, 100);

}


function fecharCheckout() {

    modalCheckout.hidden = true;
    document.body.style.overflow = "";

}


/* =========================================================
   4. ALTERNAR TIPO DE ENTREGA
   ========================================================= */

function alternarTipoEntrega(tipo) {

    tipoEntregaAtual = tipo;

    if (tipo === "recolha") {

        secaoMorada.hidden = true;
        taxaEntregaCalculada = 0;
        atualizarResumoFinal();

    } else {

        secaoMorada.hidden = false;
        atualizarTaxa();

    }

}


/* =========================================================
   5. ATUALIZAR TAXA DE ENTREGA
   ========================================================= */

async function atualizarTaxa() {

    const zonaId = selectZona?.value;

    if (!zonaId) {
        resumoTaxa.hidden = true;
        taxaEntregaCalculada = 0;
        atualizarResumoFinal();
        return;
    }

    // Verificar se zonas.js está carregado
    if (typeof calcularTaxaEntrega !== "function") {
        console.warn("⚠️ zonas.js não carregado — taxa de entrega não calculada");
        taxaEntregaCalculada = 0;
        atualizarResumoFinal();
        return;
    }

    // Contar estafetas disponíveis
    let disponiveis = 3;
    if (typeof contarEstafetasDisponiveis === "function") {
        disponiveis = await contarEstafetasDisponiveis();
    }

    const taxa = calcularTaxaEntrega(zonaId, disponiveis);

    if (!taxa) {
        resumoTaxa.hidden = true;
        taxaEntregaCalculada = 0;
        atualizarResumoFinal();
        return;
    }

    document.querySelector("#taxaBase").textContent = formatarPreco(taxa.base);
    document.querySelector("#taxaTotal").textContent = formatarPreco(taxa.total);

    const linhaHora = document.querySelector("#linhaAjusteHora");
    if (taxa.ajusteHora > 0) {
        linhaHora.hidden = false;
        document.querySelector("#motivoHora").textContent = taxa.motivoHora;
        document.querySelector("#valorHora").textContent =
            "+" + formatarPreco(taxa.ajusteHora);
    } else {
        linhaHora.hidden = true;
    }

    const linhaDisp = document.querySelector("#linhaAjusteDisp");
    if (taxa.ajusteDisponibilidade > 0) {
        linhaDisp.hidden = false;
        document.querySelector("#motivoDisp").textContent = taxa.motivoDisponibilidade;
        document.querySelector("#valorDisp").textContent =
            "+" + formatarPreco(taxa.ajusteDisponibilidade);
    } else {
        linhaDisp.hidden = true;
    }

    document.querySelector("#tempoEstimado").textContent =
        `Tempo estimado: ${taxa.tempoMin}-${taxa.tempoMax} min`;

    resumoTaxa.hidden = false;
    recriarIcones();

    taxaEntregaCalculada = taxa.total;
    atualizarResumoFinal();

}


/* =========================================================
   6. ATUALIZAR RESUMO FINAL
   ========================================================= */

function atualizarResumoFinal() {

    const subtotal = calcularTotal();
    const total = subtotal + taxaEntregaCalculada;

    document.querySelector("#resumoSubtotal").textContent = formatarPreco(subtotal);
    document.querySelector("#resumoTaxa").textContent = formatarPreco(taxaEntregaCalculada);
    document.querySelector("#resumoTotal").textContent = formatarPreco(total);

    const linhaTaxa = document.querySelector("#resumoLinhaTaxa");

    if (tipoEntregaAtual === "recolha") {
        linhaTaxa.hidden = true;
    } else {
        linhaTaxa.hidden = false;
    }

    modalTotal.textContent = formatarPreco(total);

}


/* =========================================================
   7. ENVIAR PEDIDO PARA O FIREBASE
   ========================================================= */

async function enviarPedidoFirebase(dados) {

    const produtos = estado.carrinho.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
        subtotal: item.preco * item.quantidade
    }));

    const subtotal = calcularTotal();
    const total = subtotal + taxaEntregaCalculada;

    const pedido = {

        // Cliente
        nome: dados.nome,
        telemovel: dados.telemovel,
        email: dados.email || "",

        // Tipo e entrega
        tipoEntrega: dados.tipoEntrega,
        zona: dados.zona || null,
        morada: dados.morada || "",
        referencia: dados.referencia || "",
        taxaEntrega: taxaEntregaCalculada,

        // Pagamento
        metodoPagamento: dados.metodoPagamento,
        estadoPagamento: dados.metodoPagamento === "numerario"
            ? "pendente"
            : "aguarda_confirmacao",

        // Produtos e valores
        produtos: produtos,
        subtotal: subtotal,
        total: total,
        quantidade: calcularQuantidadeTotal(),

        // Observações
        observacoes: dados.observacoes || "",

        // Estado do pedido
        estado: "novo",
        origem: "site",

        // Estafeta (preenchido depois)
        estafetaId: null,
        estafetaNome: null,

        // Datas
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()

    };

    const ref = await db.collection("pedidos").add(pedido);

    return ref.id;

}


/* =========================================================
   8. SUBMETER FORMULÁRIO
   ========================================================= */

async function submeterCheckout(evento) {

    evento.preventDefault();

    const btnConfirmar = formCheckout.querySelector(".btn-confirmar-pedido");

    // Tipo de entrega
    const tipoEntrega = document.querySelector(
        'input[name="tipoEntrega"]:checked'
    )?.value || "entrega";

    // Dados do cliente
    const nome = document.querySelector("#checkoutNome").value.trim();
    const telemovel = document.querySelector("#checkoutTelemovel").value.trim();
    const email = document.querySelector("#checkoutEmail").value.trim();

    // Morada (só se for entrega)
    const zona = document.querySelector("#checkoutZona")?.value || "";
    const morada = document.querySelector("#checkoutMorada")?.value.trim() || "";
    const referencia = document.querySelector("#checkoutReferencia")?.value.trim() || "";

    // Pagamento
    const metodoPagamento = document.querySelector(
        'input[name="metodoPagamento"]:checked'
    )?.value || "mpesa";

    // Observações
    const observacoes = document.querySelector("#checkoutObs").value.trim();


    /* ---------- VALIDAÇÕES ---------- */

    if (!nome || !telemovel) {
        alert("Por favor, preencha o nome e o telemóvel.");
        return;
    }

    if (tipoEntrega === "entrega") {

        if (!zona) {
            alert("Por favor, escolha a sua zona.");
            selectZona?.focus();
            return;
        }

        if (!morada) {
            alert("Por favor, preencha o endereço completo.");
            inputMorada?.focus();
            return;
        }

    }


    /* ---------- ENVIO ---------- */

    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = "A enviar…";

    try {

        const dados = {
            nome,
            telemovel,
            email,
            tipoEntrega,
            zona,
            morada,
            referencia,
            metodoPagamento,
            observacoes
        };

        const idPedido = await enviarPedidoFirebase(dados);

        console.log("✅ Pedido guardado:", idPedido);

        let msg = "Pedido enviado com sucesso!\n\n";

        if (tipoEntrega === "entrega") {
            msg += "Vamos preparar e entregar na morada indicada.\n\n";
        } else {
            msg += "Pode vir recolher o pedido no restaurante.\n\n";
        }

        if (metodoPagamento === "mpesa") {
            msg += "Vai receber instruções de pagamento M-Pesa em breve.";
        } else if (metodoPagamento === "emola") {
            msg += "Vai receber instruções de pagamento e-Mola em breve.";
        } else {
            msg += "Pagamento em numerário na entrega.";
        }

        alert("✅ " + msg);

        // Limpar
        estado.carrinho = [];
        atualizarCarrinho();
        formCheckout.reset();
        taxaEntregaCalculada = 0;
        fecharCheckout();
        fecharCarrinho();

    } catch (erro) {

        console.error("❌ Erro ao enviar pedido:", erro);

        alert(
            "❌ Não foi possível enviar o pedido.\n\n" +
            "Verifique a sua ligação e tente novamente."
        );

    } finally {

        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = textoOriginal;
        recriarIcones();

    }

}


/* =========================================================
   9. EVENTOS
   ========================================================= */

// Abrir modal
if (btnFinalizar) {
    btnFinalizar.addEventListener("click", abrirCheckout);
}

// Submeter
if (formCheckout) {
    formCheckout.addEventListener("submit", submeterCheckout);
}

// Fechar
document.querySelectorAll("[data-fechar-modal]").forEach(el => {
    el.addEventListener("click", fecharCheckout);
});

// ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalCheckout?.hidden) {
        fecharCheckout();
    }
});

// Alternar tipo de entrega
document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
    radio.addEventListener("change", function () {
        alternarTipoEntrega(this.value);
    });
});

// Mudança de zona
if (selectZona) {
    selectZona.addEventListener("change", atualizarTaxa);
}


console.log("📦 checkout.js carregado — sistema de entrega ativo");