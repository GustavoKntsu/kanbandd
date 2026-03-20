// Chave usada para persistir o estado no navegador.
const STORAGE_KEY = "kanban-state-v1";

// Cria IDs únicos para colunas e cards.
function createId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

// Estado inicial padrão do quadro.
function createInitialState() {
    return {
        columns: [
            {
                id: "column-a-fazer",
                title: "A fazer",
                cards: []
            },
            {
                id: "column-fazendo",
                title: "Fazendo",
                cards: []
            },
            {
                id: "column-concluido",
                title: "Concluido",
                cards: []
            }
        ]
    };
}

// Carrega estado salvo no localStorage e aplica fallback seguro.
function loadState() {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
        return createInitialState();
    }

    try {
        const parsed = JSON.parse(rawState);
        if (!Array.isArray(parsed.columns) || parsed.columns.length === 0) {
            return createInitialState();
        }

        return parsed;
    } catch {
        return createInitialState();
    }
}

// Salva o estado atual no localStorage.
function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Store simples com leitura, inscrição e mutações do estado.
export function createStore() {
    let state = loadState();
    const listeners = new Set();

    // Persiste e avisa todos os observadores após cada mudança.
    function notify() {
        saveState(state);
        listeners.forEach((listener) => listener(state));
    }

    // Retorna snapshot do estado atual.
    function getState() {
        return state;
    }

    // Registra callback e retorna função para cancelar inscrição.
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    // Cria nova coluna com título normalizado.
    function addColumn(title = "Nova coluna") {
        const normalizedTitle = title.trim() || "Nova coluna";

        state.columns.push({
            id: createId("column"),
            title: normalizedTitle,
            cards: []
        });

        notify();
    }

    // Renomeia uma coluna existente, ignorando valores vazios.
    function renameColumn(columnId, nextTitle) {
        const column = state.columns.find((item) => item.id === columnId);
        if (!column) {
            return;
        }

        const normalizedTitle = nextTitle.trim();
        if (!normalizedTitle) {
            return;
        }

        column.title = normalizedTitle;
        notify();
    }

    // Cria card na coluna informada (ou primeira coluna como fallback).
    function addCard(text, columnId) {
        const normalizedText = text.trim();
        if (!normalizedText) {
            return;
        }

        const targetColumn = state.columns.find((column) => column.id === columnId) ?? state.columns[0];
        if (!targetColumn) {
            return;
        }

        targetColumn.cards.push({
            id: createId("card"),
            text: normalizedText
        });

        notify();
    }

    // Atualiza o texto de um card encontrado pelo ID.
    function updateCardText(cardId, nextText) {
        const normalizedText = nextText.trim();
        if (!normalizedText) {
            return;
        }

        for (const column of state.columns) {
            const card = column.cards.find((item) => item.id === cardId);
            if (card) {
                card.text = normalizedText;
                notify();
                return;
            }
        }
    }

    // Remove um card pelo ID.
    function removeCard(cardId) {
        for (const column of state.columns) {
            const cardIndex = column.cards.findIndex((item) => item.id === cardId);
            if (cardIndex !== -1) {
                column.cards.splice(cardIndex, 1);
                notify();
                return;
            }
        }
    }

    // Move um card da coluna de origem para a coluna de destino.
    function moveCard(cardId, targetColumnId) {
        if (!cardId || !targetColumnId) {
            return;
        }

        let movedCard = null;

        for (const column of state.columns) {
            const cardIndex = column.cards.findIndex((item) => item.id === cardId);
            if (cardIndex !== -1) {
                movedCard = column.cards.splice(cardIndex, 1)[0];
                break;
            }
        }

        if (!movedCard) {
            return;
        }

        const targetColumn = state.columns.find((column) => column.id === targetColumnId);
        if (!targetColumn) {
            return;
        }

        targetColumn.cards.push(movedCard);
        notify();
    }

    // API pública do store.
    return {
        getState,
        subscribe,
        addColumn,
        renameColumn,
        addCard,
        updateCardText,
        removeCard,
        moveCard
    };
}
