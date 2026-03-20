// Renderiza um card individual em HTML.
function renderCard(card) {
    return `
        <article class="card" role="listitem" draggable="true" data-card-id="${card.id}">
            <p class="card__text" data-card-text-id="${card.id}" tabindex="0" title="Dê dois cliques para editar">${card.text}</p>
            <div class="card__actions">
                <button class="card__delete" type="button" data-delete-card-id="${card.id}" aria-label="Remover card">Excluir</button>
            </div>
        </article>
    `;
}

// Renderiza uma coluna com título, contador e cards.
function renderColumn(column) {
    const cardsHtml = column.cards.map(renderCard).join("");

    return `
        <section class="column" data-column-id="${column.id}" aria-label="Coluna ${column.title}">
            <header class="column__header">
                <h2 class="column__title" data-column-title-id="${column.id}" tabindex="0" title="Dê dois cliques para editar">${column.title}</h2>
                <span class="column__count">${column.cards.length} card(s)</span>
            </header>
            <div class="column__cards" data-column-drop-id="${column.id}">
                ${cardsHtml}
            </div>
        </section>
    `;
}

// Renderiza o board completo a partir do estado atual.
export function renderBoard(state, boardElement) {
    boardElement.innerHTML = state.columns.map(renderColumn).join("");
}
