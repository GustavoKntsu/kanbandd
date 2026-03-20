# Kanban Drag and Drop

Projeto de quadro Kanban com HTML5 Drag and Drop, edição inline e layout responsivo.

## Funcionalidades

- Colunas iniciais: `A fazer`, `Fazendo` e `Concluido`.
- Criação de novos cards pelo formulário do topo.
- Arrastar e soltar cards entre colunas com API Drag and Drop do HTML5.
- Edição de texto do card com duplo clique.
- Edição do título da coluna com duplo clique.
- Criação dinâmica de novas colunas.
- Persistência automática no `localStorage`.

## Estrutura

```text
kanbandd/
├── kanban.html
├── css/
│   └── styles.css
└── js/
	├── main.js
	├── state.js
	├── render.js
	└── interactions.js
```

## Como executar

Como é um projeto estático, basta abrir `kanban.html` no navegador.

Opcional com VS Code:

1. Instale a extensão Live Server.
2. Clique com botão direito em `kanban.html`.
3. Selecione `Open with Live Server`.

## Observações de uso

- Clique duas vezes no título da coluna para renomear.
- Clique duas vezes no texto do card para editar.
- Pressione `Enter` para salvar edição inline.
- Pressione `Esc` para cancelar edição inline.
