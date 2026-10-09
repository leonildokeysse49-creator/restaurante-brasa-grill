/* =========================================================
   BRASA GRILL — ZONAS DE ENTREGA E CÁLCULO DE TAXAS
   ========================================================= */


/* =========================================================
   1. DEFINIÇÃO DAS ZONAS
   ========================================================= */

const ZONAS = [

    {
        id: "alto_mae",
        nome: "Alto Maé",
        taxa_base: 50,
        tempo_min: 15,
        tempo_max: 25,
        distancia_max_km: 3
    },

    {
        id: "baixa",
        nome: "Baixa / Central",
        taxa_base: 80,
        tempo_min: 20,
        tempo_max: 35,
        distancia_max_km: 6
    },

    {
        id: "sommerschield",
        nome: "Sommerschield / Polana",
        taxa_base: 120,
        tempo_min: 30,
        tempo_max: 45,
        distancia_max_km: 10
    },

    {
        id: "matola",
        nome: "Matola",
        taxa_base: 200,
        tempo_min: 40,
        tempo_max: 60,
        distancia_max_km: 20
    },

    {
        id: "outra",
        nome: "Outra zona (a combinar)",
        taxa_base: 250,
        tempo_min: 45,
        tempo_max: 90,
        distancia_max_km: 999
    }

];


/* =========================================================
   2. AJUSTES DINÂMICOS
   ========================================================= */

/* Ajuste por hora do dia */
function ajusteHora() {

    const hora = new Date().getHours();

    // Almoço (11h às 14h)
    if (hora >= 11 && hora < 14) {
        return { fator: 0.15, motivo: "Hora de almoço" };
    }

    // Jantar (18h às 21h)
    if (hora >= 18 && hora < 21) {
        return { fator: 0.25, motivo: "Hora de jantar" };
    }

    // Noite (21h às 23h)
    if (hora >= 21 && hora < 23) {
        return { fator: 0.20, motivo: "Horário noturno" };
    }

    return { fator: 0, motivo: null };

}


/* Ajuste por disponibilidade de estafetas */
function ajusteDisponibilidade(disponiveis) {

    if (disponiveis >= 3) {
        return { fator: 0, motivo: null };
    }

    if (disponiveis === 2) {
        return { fator: 0.20, motivo: "Poucos estafetas" };
    }

    if (disponiveis === 1) {
        return { fator: 0.40, motivo: "Apenas 1 estafeta" };
    }

    return { fator: 0.60, motivo: "Sem estafetas disponíveis" };

}


/* =========================================================
   3. CÁLCULO DE TAXA DE ENTREGA
   ========================================================= */

function calcularTaxaEntrega(zonaId, estafetasDisponiveis = 3) {

    const zona = ZONAS.find(z => z.id === zonaId);

    if (!zona) {
        return null;
    }

    const base = zona.taxa_base;

    const hora = ajusteHora();
    const disp = ajusteDisponibilidade(estafetasDisponiveis);

    const valorHora = Math.round(base * hora.fator);
    const valorDisp = Math.round(base * disp.fator);

    const total = base + valorHora + valorDisp;

    return {
        zona: zona.nome,
        base: base,
        ajusteHora: valorHora,
        motivoHora: hora.motivo,
        ajusteDisponibilidade: valorDisp,
        motivoDisponibilidade: disp.motivo,
        total: total,
        tempoMin: zona.tempo_min,
        tempoMax: zona.tempo_max
    };

}


/* =========================================================
   4. LISTAR ZONAS (para o dropdown)
   ========================================================= */

function listarZonas() {
    return ZONAS.map(z => ({
        id: z.id,
        nome: z.nome,
        taxaBase: z.taxa_base
    }));
}


/* =========================================================
   5. DISPONIBILIDADE DE ESTAFETAS
   ========================================================= */

async function contarEstafetasDisponiveis() {

    try {

        const snapshot = await db.collection("estafetas")
            .where("ativo", "==", true)
            .where("estado", "==", "disponivel")
            .get();

        return snapshot.size;

    } catch (e) {

        console.warn("Erro ao contar estafetas:", e);
        return 3; // assume valor neutro

    }

}


console.log("📍 zonas.js carregado —", ZONAS.length, "zonas");