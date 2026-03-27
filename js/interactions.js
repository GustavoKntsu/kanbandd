// Troca um elemento de texto por input para edição inline.
function startInlineEdit(targetElement, value, onCommit) {
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.className = "edit-input";
    inputElement.maxLength = 120;
    inputElement.value = value;

    const parent = targetElement.parentElement;
    if (!parent) {
        return;
    }

    let finished = false;

    function finish(shouldSave) {
        if (finished) {
            return;
        }

        finished = true;
        const nextValue = inputElement.value.trim();

        if (shouldSave && nextValue) {
            onCommit(nextValue);
        }

        inputElement.replaceWith(targetElement);
        targetElement.focus();
    }

    inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            finish(true);
        }

        if (event.key === "Escape") {
            finish(false);
        }
    });

    inputElement.addEventListener("blur", () => finish(true));

    parent.replaceChild(inputElement, targetElement);
    inputElement.focus();
    inputElement.select();
}

// Obtém o ID da coluna mais próxima do elemento clicado/arrastado.
function getClosestColumnId(element) {
    const columnElement = element.closest("[data-column-id]");
    if (!columnElement) {
        return null;
    }

    return columnElement.getAttribute("data-column-id");
}

// Remove destaque visual das colunas após ações de drag and drop.
function clearDragHighlights(boardElement) {
    boardElement
        .querySelectorAll(".column--drag-over")
        .forEach((column) => column.classList.remove("column--drag-over"));
    
    // Remove placeholder visual de drop zones.
    boardElement
        .querySelectorAll(".column__cards--drop-active")
        .forEach((zone) => zone.classList.remove("column__cards--drop-active"));
}

// Conecta todos os eventos de interação entre DOM e store.
export function bindInteractions({ boardElement, formElement, addColumnButton, store }) {
    const cardInput = formElement.querySelector("#new-card-text");
    const createCardButton = formElement.querySelector("button[type='submit']");
    const isTouchDevice = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    let lastTouchActionAt = 0;

    function isGhostAction() {
        return Date.now() - lastTouchActionAt < 450;
    }

    function createCardAction() {
        const state = store.getState();
        const firstColumn = state.columns[0];
        if (!firstColumn || !cardInput) {
            return;
        }

        store.addCard(cardInput.value, firstColumn.id);
        cardInput.value = "";
        cardInput.focus();
    }

    function addColumnAction() {
        store.addColumn("Nova coluna");
    }

    function markTouchActionNow() {
        lastTouchActionAt = Date.now();
    }

    // Cria card ao enviar formulário.
    formElement.addEventListener("submit", (event) => {
        event.preventDefault();

        if (isGhostAction()) {
            return;
        }

        createCardAction();
    });

    // Fallback mobile: usa touchend para não conflitar com o polyfill de drag,
    // que intercepta touchstart globalmente. preventDefault evita o click fantasma.
    if (isTouchDevice && createCardButton) {
        createCardButton.addEventListener("touchend", (event) => {
            event.preventDefault();
            markTouchActionNow();
            createCardAction();
        }, { passive: false });
    }

    // Cria uma nova coluna com título padrão.
    addColumnButton.addEventListener("click", () => {
        if (isGhostAction()) {
            return;
        }
        addColumnAction();
    });

    // Fallback mobile: idem ao createCardButton — touchend evita conflito com o polyfill.
    if (isTouchDevice) {
        addColumnButton.addEventListener("touchend", (event) => {
            event.preventDefault();
            markTouchActionNow();
            addColumnAction();
        }, { passive: false });
    }

    // Remove card ou coluna ao clicar em botão de excluir.
    boardElement.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const deleteCardButton = target.closest("[data-delete-card-id]");
        if (deleteCardButton) {
            const cardId = deleteCardButton.getAttribute("data-delete-card-id");
            if (cardId) {
                store.removeCard(cardId);
            }
            return;
        }

        const deleteColumnButton = target.closest("[data-delete-column-id]");
        if (deleteColumnButton) {
            const columnId = deleteColumnButton.getAttribute("data-delete-column-id");
            if (columnId && confirm("Tem certeza que deseja deletar esta coluna e todos seus cards?")) {
                store.deleteColumn(columnId);
            }
        }
    });

    // Ativa edição inline com duplo clique em card ou título de coluna.
    boardElement.addEventListener("dblclick", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const cardTextElement = target.closest("[data-card-text-id]");
        if (cardTextElement) {
            const cardId = cardTextElement.getAttribute("data-card-text-id");
            if (!cardId) {
                return;
            }

            startInlineEdit(cardTextElement, cardTextElement.textContent ?? "", (nextValue) => {
                store.updateCardText(cardId, nextValue);
            });
            return;
        }

        const columnTitleElement = target.closest("[data-column-title-id]");
        if (columnTitleElement) {
            const columnId = columnTitleElement.getAttribute("data-column-title-id");
            if (!columnId) {
                return;
            }

            startInlineEdit(columnTitleElement, columnTitleElement.textContent ?? "", (nextValue) => {
                store.renameColumn(columnId, nextValue);
            });
        }
    });

    // Inicia arraste de card ou coluna e registra tipo e ID no dataTransfer.
    boardElement.addEventListener("dragstart", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !(event.dataTransfer instanceof DataTransfer)) {
            return;
        }

        // Verifica se é uma coluna sendo arrastada (evita conflito com cards dentro da coluna).
        const columnElement = target.closest(".column[data-column-id]");
        if (columnElement && !target.closest("[data-card-id]")) {
            const columnId = columnElement.getAttribute("data-column-id");
            if (columnId) {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/x-column-id", columnId);
                event.dataTransfer.setData("text/plain", `column:${columnId}`);
                columnElement.classList.add("column--dragging");
                return;
            }
        }

        // Verifica se é um card sendo arrastado.
        const cardElement = target.closest("[data-card-id]");
        if (!cardElement) {
            return;
        }

        const cardId = cardElement.getAttribute("data-card-id");
        if (!cardId) {
            return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-card-id", cardId);
        event.dataTransfer.setData("text/plain", `card:${cardId}`);
        cardElement.classList.add("card--dragging");
    });

    // Finaliza arraste removendo estados visuais temporários.
    boardElement.addEventListener("dragend", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        // Remove estado de arraste de coluna.
        const columnElement = target.closest(".column[data-column-id]");
        if (columnElement) {
            columnElement.classList.remove("column--dragging");
        }

        // Remove estado de arraste de card.
        const cardElement = target.closest("[data-card-id]");
        if (cardElement) {
            cardElement.classList.remove("card--dragging");
        }

        clearDragHighlights(boardElement);
    });

    // Mantém destino de drop ativo e destaca coluna atual com placeholder visual.
    boardElement.addEventListener("dragover", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const columnId = getClosestColumnId(target);
        if (!columnId) {
            return;
        }

        event.preventDefault();

        clearDragHighlights(boardElement);
        
        // Destaca coluna e sua drop zone com efeito visual.
        const activeColumn = boardElement.querySelector(`[data-column-id="${columnId}"]`);
        activeColumn?.classList.add("column--drag-over");
        
        // Adiciona placeholder visual na zona de drop (container de cards).
        const dropZone = activeColumn?.querySelector("[data-column-drop-id]");
        dropZone?.classList.add("column__cards--drop-active");
    });

    // Conclui drop e move card ou coluna para alvo.
    boardElement.addEventListener("drop", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !(event.dataTransfer instanceof DataTransfer)) {
            return;
        }

        event.preventDefault();

        // Verifica se é drop de coluna (reordenação de colunas).
        let movedColumnId = event.dataTransfer.getData("application/x-column-id");
        const plainData = event.dataTransfer.getData("text/plain");
        if (!movedColumnId && plainData.startsWith("column:")) {
            movedColumnId = plainData.slice("column:".length);
        }
        if (movedColumnId) {
            const state = store.getState();
            const columns = state.columns;
            const sourceIndex = columns.findIndex((col) => col.id === movedColumnId);

            // Encontra a coluna alvo e calcula o índice de destino.
            const targetColumnElement = target.closest(".column[data-column-id]");
            if (!targetColumnElement) {
                clearDragHighlights(boardElement);
                return;
            }

            const targetColumnId = targetColumnElement.getAttribute("data-column-id");
            const targetIndex = columns.findIndex((col) => col.id === targetColumnId);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                store.reorderColumns(sourceIndex, targetIndex);
            }

            clearDragHighlights(boardElement);
            return;
        }

        // Verifica se é drop de card (mover card para coluna).
        let cardId = event.dataTransfer.getData("application/x-card-id");
        if (!cardId && plainData.startsWith("card:")) {
            cardId = plainData.slice("card:".length);
        }
        if (cardId) {
            const columnId = getClosestColumnId(target);
            if (columnId) {
                store.moveCard(cardId, columnId);
            }
        }

        clearDragHighlights(boardElement);
    });
}