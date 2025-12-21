# Sistema de Design — Destaque Ativo e Feedback Háptico

- Padrão de destaque: usar `bg-accent/50` para itens ativos na navegação móvel (botões da barra inferior e links do painel móvel).
- Duração das animações: aplicar `duration-200` em interações móveis e no painel deslizante.
- Feedback háptico: chamar `navigator.vibrate(10)` na ativação de itens, com verificação `if ('vibrate' in navigator)`.
- Acessibilidade: manter `aria-current`, `aria-pressed`, `aria-selected` e `text-accent-foreground` para contraste adequado.

Referências de código:
- `components/dashboard-layout.tsx:222` — `SheetContent` com `duration-200`.
- `components/dashboard-layout.tsx:339-352` — botão de grupo (barra inferior) com `bg-accent/50` e vibração.
- `components/dashboard-layout.tsx:362-371` — link `Início` com `bg-accent/50`, `duration-200` e vibração.
- `components/dashboard-layout.tsx:386-401` — botão de grupo (barra inferior) com `bg-accent/50` e vibração.
- `components/dashboard-layout.tsx:409-413` — painel móvel com `duration-200`.
- `components/dashboard-layout.tsx:434-447` — links do painel com `bg-accent/50`, `duration-200` e vibração.
- `components/dashboard-layout.tsx:148-153` — `MenuLink` fecha o menu e vibra.
