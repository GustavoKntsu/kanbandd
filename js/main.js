import { createStore } from "./state.js";
import { renderBoard } from "./render.js";
import { bindInteractions } from "./interactions.js";
import { initTheme, setupThemeToggle } from "./theme.js";

// Inicializa a aplicação conectando DOM, estado, renderização e eventos.
function initKanbanApp() {
    // Inicializa sistema de tema escuro/claro.
    initTheme();
    
    // Elementos principais usados pelo app.
    const boardElement = document.querySelector("#board");
    const formElement = document.querySelector("#new-card-form");
    const addColumnButton = document.querySelector("#add-column-button");
    const themeToggleButton = document.querySelector("#theme-toggle");

    // Falha cedo se a estrutura HTML esperada não existir.
    if (!(boardElement instanceof HTMLElement)) {
        throw new Error("Elemento #board não encontrado.");
    }

    if (!(formElement instanceof HTMLFormElement)) {
        throw new Error("Elemento #new-card-form não encontrado.");
    }

    if (!(addColumnButton instanceof HTMLButtonElement)) {
        throw new Error("Elemento #add-column-button não encontrado.");
    }

    if (!(themeToggleButton instanceof HTMLButtonElement)) {
        throw new Error("Elemento #theme-toggle não encontrado.");
    }

    // Store central com o estado e as operações do Kanban.
    const store = createStore();

    // Re-renderiza o quadro sempre que o estado mudar.
    function refresh(nextState) {
        renderBoard(nextState, boardElement);
    }

    // Registra o render reativo e força o primeiro desenho da tela.
    store.subscribe(refresh);
    refresh(store.getState());

    // Conecta interações da interface (form, edição, drag and drop etc.).
    bindInteractions({
        boardElement,
        formElement,
        addColumnButton,
        store
    });

    // Configura o botão de toggle de tema.
    setupThemeToggle(themeToggleButton);
}

// Ponto de boot do módulo.
initKanbanApp();
