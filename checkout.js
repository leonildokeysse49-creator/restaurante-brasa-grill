/* =========================================================
   BRASA GRILL — CHECKOUT
   Taxa a combinar + GPS opcional
   ========================================================= */

const modalCheckout = document.querySelector("#modalCheckout");
const modalTotal = document.querySelector("#modalTotal");
const formCheckout = document.querySelector("#formCheckout");
const btnFinalizar = document.querySelector("#btnFinalizar");
const secaoMorada = document.querySelector("#secaoMorada");
const inputMorada = document.querySelector("#checkoutMorada");
const btnUsarLocalizacao = document.querySelector("#btnUsarLocalizacao");
const estadoLocalizacao = document.querySelector("#estadoLocalizacao");

let tipoEntregaAtual = "entrega";
let localizacaoCliente = null;


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
    recriarIcones();

    setTimeout(() => document.querySelector("#checkoutNome")?.focus(), 100);
}

function fecharCheckout() {
    modalCheckout.hidden = true;
    document.body.style.overflow = "";
}

function alternarTipoEntrega(tipo) {
    tipoEntregaAtual = tipo;
    if (tipo === "recolha") {
        secaoMorada.hidden = true;
    } else {
        secaoMorada.hidden = false;
    }
}


/* GPS */

if (btnUsarLocalizacao) {
    btnUsarLocalizacao.addEventListener("click", function () {
        if (!navigator.geolocation) {
            alert("❌ O seu dispositivo não suporta localização.");
            return;
        }

        btnUsarLocalizacao.disabled = true;
        btnUsarLocalizacao.innerHTML = "A obter localização…";

        navigator.geolocation.getCurrentPosition(
            function (posicao) {
                localizacaoCliente = {
                    lat: posicao.coords.latitude,
                    lng: posicao.coords.longitude
                };

                estadoLocalizacao.innerHTML = '<i data-lucide="check-circle"></i> Localização partilhada com sucesso.';
                estadoLocalizacao.classList.add("sucesso");

                btnUsarLocalizacao.innerHTML = '<i data-lucide="check"></i> Localização captada';
                btnUsarLocalizacao.classList.add("ativo");
                btnUsarLocalizacao.disabled = false;

                recriarIcones();
            },
            function (erro) {
                console.warn("GPS erro:", erro);
                btnUsarLocalizacao.disabled = false;
                btnUsarLocalizacao.innerHTML = '<i data-lucide="map-pin"></i> Usar a minha localização';
                estadoLocalizacao.textContent = "Não conseguimos obter a localização. Pode continuar com a morada escrita.";
                recriarIcones();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}


/* Enviar pedido */

async function enviarPedidoFirebase(dados) {
    const produtos = estado.carrinho.map(item => ({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        quantidade: item.quantidade,
        subtotal: item.preco * item.quantidade
    }));

    const subtotal = calcularTotal();

    const pedido = {
        nome: dados.nome,
        telemovel: dados.telemovel,
        email: dados.email || "",
        tipoEntrega: dados.tipoEntrega,
        morada: dados.morada || "",
        referencia: dados.referencia || "",
        localizacao: localizacaoCliente,
        metodoPagamento: dados.metodoPagamento,
        estadoPagamento: dados.metodoPagamento === "numerario" ? "pendente" : "aguarda_confirmacao",
        produtos: produtos,
        subtotal: subtotal,
        total: subtotal,
        quantidade: calcularQuantidadeTotal(),
        observacoes: dados.observacoes || "",
        estado: "novo",
        origem: "site",
        estafetaId: null,
        estafetaNome: null,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection("pedidos").add(pedido);
    return ref.id;
}


async function submeterCheckout(evento) {
    evento.preventDefault();

    const btnConfirmar = formCheckout.querySelector(".btn-confirmar-pedido");

    const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value || "entrega";
    const nome = document.querySelector("#checkoutNome").value.trim();
    const telemovel = document.querySelector("#checkoutTelemovel").value.trim();
    const email = document.querySelector("#checkoutEmail").value.trim();
    const morada = document.querySelector("#checkoutMorada")?.value.trim() || "";
    const referencia = document.querySelector("#checkoutReferencia")?.value.trim() || "";
    const metodoPagamento = document.querySelector('input[name="metodoPagamento"]:checked')?.value || "mpesa";
    const observacoes = document.querySelector("#checkoutObs").value.trim();

    if (!nome || !telemovel) {
        alert("Por favor, preencha o nome e o telemóvel.");
        return;
    }

    if (tipoEntrega === "entrega" && !morada) {
        alert("Por favor, preencha o endereço.");
        inputMorada?.focus();
        return;
    }

    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = "A enviar…";

    try {
        const dados = { nome, telemovel, email, tipoEntrega, morada, referencia, metodoPagamento, observacoes };
        const idPedido = await enviarPedidoFirebase(dados);
        console.log("✅ Pedido guardado:", idPedido);

        let msg = "Pedido enviado com sucesso!\n\n";
        if (tipoEntrega === "entrega") {
            msg += "Vamos preparar e entregar na morada indicada.\n";
            msg += "A taxa de entrega será combinada pelo WhatsApp.\n\n";
        } else {
            msg += "Pode vir recolher o pedido no restaurante.\n\n";
        }

        if (metodoPagamento === "mpesa") msg += "Vai receber instruções de pagamento M-Pesa em breve.";
        else if (metodoPagamento === "emola") msg += "Vai receber instruções de pagamento e-Mola em breve.";
        else msg += "Pagamento em numerário na entrega.";

        alert("✅ " + msg);

        estado.carrinho = [];
        atualizarCarrinho();
        formCheckout.reset();
        localizacaoCliente = null;
        fecharCheckout();
        fecharCarrinho();

    } catch (erro) {
        console.error("❌ Erro:", erro);
        alert("❌ Não foi possível enviar o pedido.\n\nVerifique a sua ligação e tente novamente.");
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = textoOriginal;
        recriarIcones();
    }
}


/* Eventos */

if (btnFinalizar) btnFinalizar.addEventListener("click", abrirCheckout);
if (formCheckout) formCheckout.addEventListener("submit", submeterCheckout);

document.querySelectorAll("[data-fechar-modal]").forEach(el => {
    el.addEventListener("click", fecharCheckout);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalCheckout?.hidden) fecharCheckout();
});

document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
    radio.addEventListener("change", function () { alternarTipoEntrega(this.value); });
});

console.log("📦 checkout.js carregado");