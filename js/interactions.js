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
}

// Conecta todos os eventos de interação entre DOM e store.
export function bindInteractions({ boardElement, formElement, addColumnButton, store }) {
    const cardInput = formElement.querySelector("#new-card-text");

    // Cria card ao enviar formulário.
    formElement.addEventListener("submit", (event) => {
        event.preventDefault();

        const state = store.getState();
        const firstColumn = state.columns[0];
        if (!firstColumn || !cardInput) {
            return;
        }

        store.addCard(cardInput.value, firstColumn.id);
        cardInput.value = "";
        cardInput.focus();
    });

    // Cria uma nova coluna com título padrão.
    addColumnButton.addEventListener("click", () => {
        store.addColumn("Nova coluna");
    });

    // Remove card ao clicar no botão de excluir.
    boardElement.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const deleteButton = target.closest("[data-delete-card-id]");
        if (deleteButton) {
            const cardId = deleteButton.getAttribute("data-delete-card-id");
            if (cardId) {
                store.removeCard(cardId);
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

    // Inicia arraste do card e registra ID no dataTransfer.
    boardElement.addEventListener("dragstart", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const cardElement = target.closest("[data-card-id]");
        if (!cardElement || !(event.dataTransfer instanceof DataTransfer)) {
            return;
        }

        const cardId = cardElement.getAttribute("data-card-id");
        if (!cardId) {
            return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", cardId);
        cardElement.classList.add("card--dragging");
    });

    // Finaliza arraste removendo estados visuais temporários.
    boardElement.addEventListener("dragend", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const cardElement = target.closest("[data-card-id]");
        if (cardElement) {
            cardElement.classList.remove("card--dragging");
        }

        clearDragHighlights(boardElement);
    });

    // Mantém destino de drop ativo e destaca coluna atual.
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
        const activeColumn = boardElement.querySelector(`[data-column-id="${columnId}"]`);
        activeColumn?.classList.add("column--drag-over");
    });

    // Conclui drop e move o card para a coluna alvo.
    boardElement.addEventListener("drop", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !(event.dataTransfer instanceof DataTransfer)) {
            return;
        }

        const columnId = getClosestColumnId(target);
        if (!columnId) {
            return;
        }

        event.preventDefault();
        const cardId = event.dataTransfer.getData("text/plain");
        store.moveCard(cardId, columnId);
        clearDragHighlights(boardElement);
    });
}
