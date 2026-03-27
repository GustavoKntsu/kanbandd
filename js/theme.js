// Sistema de tema escuro/claro com toggle e persistência em localStorage.

const THEME_KEY = "kanban-theme-preference";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

/**
 * Detecta a preferência de tema do SO (prefers-color-scheme).
 * Retorna "dark" ou "light".
 */
function getSystemThemePreference() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return DARK_THEME;
    }
    return LIGHT_THEME;
}

/**
 * Obtém o tema salvo no localStorage ou a preferência do SO.
 */
function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === DARK_THEME || saved === LIGHT_THEME) {
        return saved;
    }
    // Se não houver salvo, usa preferência do SO.
    return getSystemThemePreference();
}

/**
 * Aplica o tema ao body adicionando/removendo atributo data-theme.
 */
function applyTheme(theme) {
    const isValid = theme === DARK_THEME || theme === LIGHT_THEME;
    if (!isValid) {
        console.warn(`[Theme] Tema inválido: ${theme}. Usando light.`);
        theme = LIGHT_THEME;
    }

    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Alterna entre tema escuro e claro.
 */
function toggleTheme() {
    const current = document.body.getAttribute("data-theme") || LIGHT_THEME;
    const next = current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    applyTheme(next);
    return next;
}

/**
 * Obtém o tema atual.
 */
function getCurrentTheme() {
    return document.body.getAttribute("data-theme") || LIGHT_THEME;
}

/**
 * Inicializa o sistema de tema ao carregar a página.
 */
export function initTheme() {
    const theme = getSavedTheme();
    applyTheme(theme);
}

/**
 * Configura o botão de toggle de tema.
 * @param {HTMLElement} buttonElement - Botão que será clicado para alternar tema.
 */
export function setupThemeToggle(buttonElement) {
    if (!buttonElement) {
        console.warn("[Theme] Botão de toggle não encontrado.");
        return;
    }

    buttonElement.addEventListener("click", () => {
        const newTheme = toggleTheme();
        updateThemeButtonIcon(buttonElement, newTheme);
    });

    // Atualiza ícone inicial.
    updateThemeButtonIcon(buttonElement, getCurrentTheme());
}

/**
 * Atualiza o ícone do botão de acordo com o tema.
 */
function updateThemeButtonIcon(buttonElement, theme) {
    if (theme === DARK_THEME) {
        buttonElement.textContent = "☀️"; // Sol (clique para light)
        buttonElement.title = "Mudar para tema claro";
    } else {
        buttonElement.textContent = "🌙"; // Lua (clique para dark)
        buttonElement.title = "Mudar para tema escuro";
    }
}

export { toggleTheme, getCurrentTheme };
