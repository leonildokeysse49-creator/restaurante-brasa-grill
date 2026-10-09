/* =========================================================
   BRASA GRILL — CHECKOUT
   Lógica do modal de finalização + envio de pedido
   ========================================================= */


/* =========================================================
   1. ELEMENTOS
   ========================================================= */

const modalCheckout = document.querySelector("#modalCheckout");
const modalTotal = document.querySelector("#modalTotal");
const formCheckout = document.querySelector("#formCheckout");
const btnFinalizar = document.querySelector("#btnFinalizar");


/* =========================================================
   2. ABRIR / FECHAR MODAL
   ========================================================= */

function abrirCheckout() {

    if (estado.carrinho.length === 0) {
        alert("Adicione pelo menos um produto ao pedido.");
        return;
    }

    modalTotal.textContent = formatarPreco(calcularTotal());

    modalCheckout.hidden = false;

    document.body.style.overflow = "hidden";

    recriarIcones();

    // Foco no primeiro campo
    setTimeout(() => {
        document.querySelector("#checkoutNome")?.focus();
    }, 100);

}


function fecharCheckout() {

    modalCheckout.hidden = true;

    document.body.style.overflow = "";

}


/* =========================================================
   3. ENVIAR PEDIDO PARA O FIREBASE
   ========================================================= */

async function enviarPedidoFirebase(dadosCliente) {

    // Preparar produtos no formato que vai para o Firebase
    const produtos = estado.carrinho.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
        subtotal: item.preco * item.quantidade
    }));

    const pedido = {

        // Dados do cliente
        nome: dadosCliente.nome,
        telemovel: dadosCliente.telemovel,
        email: dadosCliente.email || "",
        morada: dadosCliente.morada || "",
        observacoes: dadosCliente.observacoes || "",

        // Produtos e totais
        produtos: produtos,
        total: calcularTotal(),
        quantidade: calcularQuantidadeTotal(),

        // Estado
        estado: "novo",
        origem: "site",

        // Data (o Firebase preenche com a hora do servidor)
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()

    };

    // Guardar na coleção "pedidos"
    const ref = await db.collection("pedidos").add(pedido);

    return ref.id;

}


/* =========================================================
   4. SUBMETER FORMULÁRIO
   ========================================================= */

async function submeterCheckout(evento) {

    evento.preventDefault();

    const btnConfirmar = formCheckout.querySelector(".btn-confirmar-pedido");

    // Recolher dados
    const nome = document.querySelector("#checkoutNome").value.trim();
    const telemovel = document.querySelector("#checkoutTelemovel").value.trim();
    const email = document.querySelector("#checkoutEmail").value.trim();
    const morada = document.querySelector("#checkoutMorada").value.trim();
    const observacoes = document.querySelector("#checkoutObs").value.trim();

    // Validar
    if (!nome || !telemovel) {
        alert("Por favor, preencha o nome e o telemóvel.");
        return;
    }

    // Desativar botão + feedback
    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = "A enviar…";

    try {

        const dadosCliente = { nome, telemovel, email, morada, observacoes };

        // 1. Enviar para o Firebase
        const idPedido = await enviarPedidoFirebase(dadosCliente);

        console.log("✅ Pedido guardado com ID:", idPedido);

        // 2. Feedback de sucesso
        alert(
            "✅ Pedido enviado com sucesso!\n\n" +
            "Recebemos o seu pedido e vamos confirmar em breve.\n\n" +
            "Obrigado!"
        );

        // 3. Limpar carrinho e fechar
        estado.carrinho = [];
        atualizarCarrinho();
        formCheckout.reset();
        fecharCheckout();

        // 4. Fechar carrinho também
        fecharCarrinho();

    } catch (erro) {

        console.error("❌ Erro ao enviar pedido:", erro);

        alert(
            "❌ Não foi possível enviar o pedido.\n\n" +
            "Verifique a sua ligação à internet e tente novamente."
        );

    } finally {

        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = textoOriginal;
        recriarIcones();

    }

}


/* =========================================================
   5. EVENTOS
   ========================================================= */

// Abrir modal
if (btnFinalizar) {
    btnFinalizar.addEventListener("click", abrirCheckout);
}

// Submeter formulário
if (formCheckout) {
    formCheckout.addEventListener("submit", submeterCheckout);
}

// Fechar modal (clique no fundo ou em ✕)
document.querySelectorAll("[data-fechar-modal]").forEach(el => {
    el.addEventListener("click", fecharCheckout);
});

// Fechar com tecla ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalCheckout?.hidden) {
        fecharCheckout();
    }
});


console.log("📦 checkout.js carregado");