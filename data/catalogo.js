/* =========================================================
   BRASA GRILL — CATÁLOGO DE PRODUTOS
   Dados extraídos das imagens oficiais do menu.
   ========================================================= */

const catalogo = [

    /* =====================================================
       PROMOÇÕES
       ===================================================== */
    {
        id: "promo-2-pizzas",
        nome: "SUPER PROMOÇÃO — 2 PIZZAS LARGE",
        categoria: "promocao",
        preco: 1000,
        descricao: "Todas as 3ª e 5ª feiras, leva 2 pizzas large por apenas 1000 MT."
    },
    {
        id: "picanha-a-brasa",
        nome: "PICANHA A BRASA",
        categoria: "promocao",
        preco: 780,
        descricao: "250g de picanha grelhada com arroz e batatas."
    },
    {
        id: "batata-cheddar-bacon",
        nome: "BATATA CHEDDAR COM BACON",
        categoria: "promocao",
        preco: 250,
        descricao: "Batata frita coberta com cheddar cremoso e bacon crocante."
    },
    {
        id: "caixa-felicidade",
        nome: "CAIXA FELICIDADE",
        categoria: "promocao",
        preco: 0,
        descricao: "Meio frango com batata + 1 Hot Dog. Sabor que marca!"
    },


    /* =====================================================
       BURGERS
       (Todos também disponíveis com batata e refresco)
       ===================================================== */
    { id: "cheese-burger", nome: "CHEESE BURGER", categoria: "burger", preco: 200, descricao: "Pão, carne e queijo. Disponível também com batata e refresco (360 MT)." },
    { id: "classico", nome: "CLASSICO", categoria: "burger", preco: 320, descricao: "Pão, carne, queijo, alface e tomate. Disponível também com batata e refresco (480 MT)." },
    { id: "x-macon", nome: "X-MACON", categoria: "burger", preco: 380, descricao: "Pão, carne, queijo e bacon. Disponível também com batata e refresco (540 MT)." },
    { id: "spicy-burguer", nome: "SPICY BURGUER", categoria: "burger", preco: 400, descricao: "Pão, carne, queijo e molho picante. Disponível também com batata e refresco (560 MT)." },
    { id: "x-egg", nome: "X-EGG", categoria: "burger", preco: 410, descricao: "Pão, carne, queijo e ovo. Disponível também com batata e refresco (570 MT)." },
    { id: "brasa-burger", nome: "BRASA BURGER", categoria: "burger", preco: 680, descricao: "O hambúrguer especial da casa. Disponível também com batata e refresco (840 MT)." },
    { id: "grilled-chicken-burguer", nome: "GRILLED CHICKEN BURGUER", categoria: "burger", preco: 260, descricao: "Pão, frango grelhado e queijo. Disponível também com batata e refresco (430 MT)." },
    { id: "spicy-chicken-burguer", nome: "SPICY CHICKEN BURGUER", categoria: "burger", preco: 275, descricao: "Pão, frango picante e queijo. Disponível também com batata e refresco (440 MT)." },
    { id: "brasa-chicken-burguer", nome: "BRASA CHICKEN BURGUER", categoria: "burger", preco: 490, descricao: "Pão, frango da brasa e queijo. Disponível também com batata e refresco (650 MT)." },
    { id: "smoky-burger", nome: "SMOKY BURGER", categoria: "burger", preco: 420, descricao: "Pão, carne, queijo e molho smoky. Disponível também com batata e refresco (580 MT)." },


    /* =====================================================
       PIZZAS
       (Todas também disponíveis com batata e refresco)
       ===================================================== */
    { id: "pizza-margarita", nome: "MARGARITA", categoria: "pizza", preco: 545, descricao: "Mozzarella e molho de tomate. Disponível também com batata e refresco (655 MT)." },
    { id: "pizza-vegetariana", nome: "VEGETARIANA", categoria: "pizza", preco: 595, descricao: "Cogumelos, azeitonas e pimentos. Disponível também com batata e refresco (695 MT)." },
    { id: "pizza-frango", nome: "FRANGO", categoria: "pizza", preco: 650, descricao: "Frango, cogumelos, cebola, pimentos e queijo. Disponível também com batata e refresco (750 MT)." },
    { id: "pizza-carne", nome: "CARNE", categoria: "pizza", preco: 650, descricao: "Carne, pimentos, cebola e queijo. Disponível também com batata e refresco (750 MT)." },
    { id: "pizza-4-estacoes", nome: "4 ESTAÇÕES", categoria: "pizza", preco: 700, descricao: "Carne, macon, frango e margarita. Disponível também com batata e refresco (800 MT)." },
    { id: "pizza-mexicana", nome: "MEXICANA", categoria: "pizza", preco: 650, descricao: "Carne moída, pimentos e cebola. Disponível também com batata e refresco (750 MT)." },
    { id: "pizza-atum", nome: "DE ATUM", categoria: "pizza", preco: 680, descricao: "Atum, pimentos e cebola. Disponível também com batata e refresco (780 MT)." },
    { id: "pizza-palony", nome: "PALONY", categoria: "pizza", preco: 650, descricao: "Macon, palony e queijo. Disponível também com batata e refresco (750 MT)." },
    { id: "pizza-camarao", nome: "CAMARÃO", categoria: "pizza", preco: 700, descricao: "Camarão, pimentos e cebola. Disponível também com batata e refresco (800 MT)." },
    { id: "pizza-peperoni", nome: "PEPERONI", categoria: "pizza", preco: 650, descricao: "Pepperoni e queijo. Disponível também com batata e refresco (750 MT)." },
    { id: "pizza-brasa", nome: "PIZZA A BRASA", categoria: "pizza", preco: 700, descricao: "Bacon, salsicha, batata frita, alho caramelizado e fio de maionese." },
    { id: "pizza-brasa-burger", nome: "BRASA BURGUER PIZZA", categoria: "pizza", preco: 700, descricao: "Patty, bacon, cebola caramelizada, molho de hambúrguer e oreganos." },
    { id: "pizza-spicy-brasa", nome: "SPICY BRASA PIZZA", categoria: "pizza", preco: 700, descricao: "Tandoori chicken, cebola, pimenta, cogumelos e oreganos." },
    { id: "pizza-regina", nome: "REGINA", categoria: "pizza", preco: 700, descricao: "Fiambre, cogumelos e oreganos." },


    /* =====================================================
       FRANGO & ASINHAS
       (Frango disponível com batata e/ou refresco)
       ===================================================== */
    { id: "frango-14", nome: "1/4 FRANGO", categoria: "frango", preco: 240, descricao: "1/4 de frango à brasa. Com batata (260 MT) ou com batata e refresco (330 MT)." },
    { id: "frango-meio", nome: "MEIO FRANGO", categoria: "frango", preco: 390, descricao: "Meio frango à brasa. Com batata (410 MT) ou com batata e refresco (460 MT)." },
    { id: "frango-completo", nome: "FRANGO COMPLETO", categoria: "frango", preco: 795, descricao: "Frango completo à brasa." },
    { id: "asas-4", nome: "4 ASAS", categoria: "frango", preco: 285, descricao: "4 asinhas de frango grelhadas. Com batata e refresco (430 MT)." },
    { id: "asas-8", nome: "8 ASAS", categoria: "frango", preco: 440, descricao: "8 asinhas de frango grelhadas. Com batata e refresco (580 MT)." },
    { id: "asas-16", nome: "16 ASAS", categoria: "frango", preco: 895, descricao: "16 asinhas de frango grelhadas. Com batata e refresco (1120 MT)." },


    /* =====================================================
       SANDES & TOSTAS
       ===================================================== */
    { id: "sande-ovo", nome: "SANDE DE OVO", categoria: "sandes", preco: 100, descricao: "Sande de ovo." },
    { id: "sande-ovo-queijo-fiambre", nome: "SANDES DE OVO (C/ QUEIJO E FIAMBRE)", categoria: "sandes", preco: 160, descricao: "Sande de ovo com queijo e fiambre." },
    { id: "tosta-atum", nome: "TOSTA DE ATUM", categoria: "sandes", preco: 170, descricao: "Tosta de atum." },
    { id: "tosta-carne", nome: "TOSTA DE CARNE", categoria: "sandes", preco: 190, descricao: "Tosta de carne." },
    { id: "tosta-queijo-tomate", nome: "DE QUEIJO E TOMATE", categoria: "sandes", preco: 125, descricao: "Tosta de queijo e tomate." },
    { id: "tosta-mista", nome: "TOSTA MISTA", categoria: "sandes", preco: 150, descricao: "Tosta mista." },
    { id: "tosta-galinha-maionese", nome: "TOSTA DE GALINHA E MAIONESE", categoria: "sandes", preco: 180, descricao: "Tosta de galinha e maionese." },


    /* =====================================================
       PREGO, ROLLS & WRAP
       (Todos também disponíveis com batata e refresco)
       ===================================================== */
    { id: "prego-frango", nome: "PREGO DE FRANGO", categoria: "prego", preco: 190, descricao: "Prego de frango. Com batata e refresco (350 MT)." },
    { id: "prego-carne", nome: "PREGO DE CARNE", categoria: "prego", preco: 195, descricao: "Prego de carne. Com batata e refresco (360 MT)." },
    { id: "completo-frango", nome: "COMPLETO DE FRANGO", categoria: "prego", preco: 240, descricao: "Prego completo de frango (extra queijo e fiambre). Com batata e refresco (405 MT)." },
    { id: "completo-carne", nome: "COMPLETO DE CARNE", categoria: "prego", preco: 250, descricao: "Prego completo de carne (extra queijo e fiambre). Com batata e refresco (415 MT)." },
    { id: "hot-dog-roll", nome: "HOT DOG ROLL", categoria: "prego", preco: 125, descricao: "Hot dog roll. Com batata e refresco (300 MT)." },
    { id: "hot-dog-roll-especial", nome: "HOT DOG ROLL ESPECIAL", categoria: "prego", preco: 240, descricao: "Hot dog roll especial. Com batata e refresco (410 MT)." },
    { id: "chip-roll", nome: "CHIP ROLL", categoria: "prego", preco: 95, descricao: "Chip roll. Com batata e refresco (260 MT)." },
    { id: "wrap-frango-grelhado", nome: "WRAP DE FRANGO GRELHADO", categoria: "prego", preco: 300, descricao: "Wrap de frango grelhado. Com batata e refresco (465 MT)." },
    { id: "wrap-carne", nome: "WRAP DE CARNE", categoria: "prego", preco: 330, descricao: "Wrap de carne. Com batata e refresco (500 MT)." },
    { id: "wrap-frango-frito", nome: "WRAP DE FRANGO FRITO", categoria: "prego", preco: 330, descricao: "Wrap de frango frito. Com batata e refresco (500 MT)." },


    /* =====================================================
       BATATA & EXTRAS
       ===================================================== */
    { id: "batata-pequena", nome: "BATATA FRITA PEQUENA", categoria: "batata", preco: 100, descricao: "Batata frita pequena." },
    { id: "batata-media", nome: "BATATA FRITA MÉDIA", categoria: "batata", preco: 145, descricao: "Batata frita média." },
    { id: "batata-grande", nome: "BATATA FRITA GRANDE", categoria: "batata", preco: 185, descricao: "Batata frita grande." },
    { id: "batata-especial", nome: "BATATA FRITA ESPECIAL", categoria: "batata", preco: 340, descricao: "Batata frita especial." },
    { id: "extra-ovo", nome: "EXTRA OVO", categoria: "batata", preco: 30, descricao: "Ovo extra." },
    { id: "extra-queijo", nome: "EXTRA QUEIJO", categoria: "batata", preco: 30, descricao: "Queijo extra." },
    { id: "extra-macon", nome: "EXTRA MACON", categoria: "batata", preco: 60, descricao: "Macon extra." },
    { id: "extra-fiambre", nome: "EXTRA FIAMBRE", categoria: "batata", preco: 35, descricao: "Fiambre extra." },
    { id: "arroz", nome: "ARROZ", categoria: "batata", preco: 80, descricao: "Porção de arroz." },
    { id: "pao", nome: "PÃO", categoria: "batata", preco: 15, descricao: "Pão." },
    { id: "salada", nome: "SALADA", categoria: "batata", preco: 85, descricao: "Salada." },
    { id: "pao-alho", nome: "PÃO DE ALHO", categoria: "batata", preco: 145, descricao: "Pão de alho." },


    /* =====================================================
       BEBIDAS
       ===================================================== */
    { id: "coca-cola-330", nome: "COCA COLA 330ML", categoria: "bebidas", preco: 75, descricao: "Lata de Coca Cola 330ml." },
    { id: "coca-cola-2l", nome: "COCA COLA 2L", categoria: "bebidas", preco: 185, descricao: "Garrafa de Coca Cola 2L." },
    { id: "dry-lemon-ginger", nome: "DRY LEMON / GINGER ALE", categoria: "bebidas", preco: 85, descricao: "Refrigerante Dry Lemon ou Ginger Ale." },
    { id: "cappy-330", nome: "CAPPY 330ML", categoria: "bebidas", preco: 90, descricao: "Sumo Cappy 330ml." },
    { id: "compal-500", nome: "COMPAL 500ML", categoria: "bebidas", preco: 100, descricao: "Sumo Compal 500ml." },
    { id: "compal-180", nome: "COMPAL 180ML", categoria: "bebidas", preco: 50, descricao: "Sumo Compal 180ml." },
    { id: "agua-500", nome: "ÁGUA 500ML", categoria: "bebidas", preco: 40, descricao: "Água mineral 500ml." },
    { id: "agua-15l", nome: "ÁGUA 1.5L", categoria: "bebidas", preco: 65, descricao: "Água mineral 1.5L." },
    { id: "compal-1l", nome: "COMPAL 1L", categoria: "bebidas", preco: 200, descricao: "Sumo Compal 1L." },
    { id: "cappy-1l", nome: "CAPPY 1L", categoria: "bebidas", preco: 120, descricao: "Sumo Cappy 1L." },


    /* =====================================================
       SOBREMESAS
       ===================================================== */
    { id: "sorvete-cone", nome: "CONE", categoria: "sobremesa", preco: 80, descricao: "Cone de sorvete." },
    { id: "sorvete-cone-topping", nome: "CONE COM TOPPING", categoria: "sobremesa", preco: 95, descricao: "Cone de sorvete com topping." },
    { id: "sorvete-copo", nome: "COPO", categoria: "sobremesa", preco: 120, descricao: "Copo de sorvete." },
    { id: "sorvete-sundae", nome: "SUNDAE", categoria: "sobremesa", preco: 150, descricao: "Sundae." },
    { id: "milkshake", nome: "MILKSHAKE", categoria: "sobremesa", preco: 265, descricao: "Milkshake nos sabores: Strawberry, Bubblegum, Chocolate, Choc/Hazel, Coffee, Caramel Fudge e Salted Caramel." },
    { id: "mocktail", nome: "MOCKTAIL", categoria: "sobremesa", preco: 150, descricao: "Mocktail nos sabores: Passion Fruit, Lemonade, Pina Colada, Blue Pomegranate, Mojito e Grenadine." }

];