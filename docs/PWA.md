# Documentação PWA - Granja Bolso

## Visão Geral

O sistema Granja Bolso foi configurado como uma Progressive Web App (PWA), permitindo que seja instalado em dispositivos móveis e desktops, funcione offline e ofereça uma experiência similar a aplicativos nativos.

## Funcionalidades Implementadas

1.  **Instalabilidade**:
    *   Arquivo `manifest.webmanifest` configurado com nome, ícones, cores e modo de exibição.
    *   Componente `PwaInstallPrompt` que detecta quando o app pode ser instalado e oferece um botão na interface.
    *   Suporte a ícones de 192x192 e 512x512 pixels.

2.  **Service Worker (Offline)**:
    *   Utiliza `@ducanh2912/next-pwa` para gerar e registrar o service worker.
    *   Cache automático de páginas navegadas (estratégia "Cache First" para assets estáticos, "Network First" para páginas).
    *   Funciona offline para páginas previamente visitadas.

3.  **Metadados**:
    *   Configuração de `viewport`, `themeColor` e `appleWebApp` no `app/layout.tsx`.

## Requisitos do Navegador

Para que a funcionalidade PWA funcione corretamente, o usuário deve utilizar um navegador moderno:

*   **Google Chrome** (Desktop e Mobile): Suporte completo.
*   **Microsoft Edge**: Suporte completo.
*   **Safari (iOS/macOS)**: Suporte via instruções manuais integradas na interface (sem prompt nativo, mas com suporte a standalone).
*   **Firefox**: Suporte completo (Android), suporte parcial (Desktop).

## Guia de Desenvolvimento

### Manutenção do Manifest

O arquivo de manifesto está localizado em `public/manifest.webmanifest`. Ao alterar ícones ou cores do tema, lembre-se de atualizar este arquivo e também os metadados em `app/layout.tsx`.

### Ícones

Os ícones são gerados a partir do arquivo `public/icons/icon.svg`. Para atualizar os ícones:
1.  Substitua o arquivo `public/icons/icon.svg`.
2.  Execute o script de geração:
    ```bash
    node scripts/generate-icons.mjs
    ```

### Service Worker

A configuração do Service Worker está em `next.config.mjs`. O plugin `@ducanh2912/next-pwa` gerencia a maior parte da complexidade.
*   **Desenvolvimento**: O SW é desativado por padrão em desenvolvimento (`disable: process.env.NODE_ENV === "development"`). Para testar, altere para `false` ou faça o build de produção.

## Verificação e Testes (Checklist)

### 1. Lighthouse PWA Score
Para verificar a pontuação PWA:
1.  Abra o Chrome DevTools.
2.  Vá para a aba **Lighthouse**.
3.  Selecione "Progressive Web App".
4.  Clique em "Analyze page load".
5.  **Meta**: Pontuação acima de 90.

### 2. Funcionamento Offline
1.  Abra o aplicativo e navegue por algumas páginas.
2.  Desligue a internet (ou use a aba "Network" do DevTools e selecione "Offline").
3.  Recarregue a página ou navegue para uma página visitada.
4.  **Esperado**: O aplicativo deve carregar e exibir o conteúdo (ou uma página de fallback).

### 3. Instalação
1.  **Desktop (Chrome/Edge)**: Verifique se aparece um ícone de instalação na barra de endereço.
2.  **Mobile (Android)**: Verifique se aparece o prompt de instalação (componente personalizado ou nativo) após interagir com o app.
3.  **Instalação Manual**: Clique no botão "Instalar" se ele aparecer na interface (gerenciado pelo `PwaInstallPrompt`).

### 4. Atualização
O Service Worker está configurado para `reloadOnOnline: true` e `skipWaiting: true` (comportamento padrão do plugin para atualizações rápidas). Ao publicar uma nova versão, o SW deve atualizar o cache na próxima visita ou recarregamento.

## Solução de Problemas

*   **Prompt de instalação não aparece**:
    *   Verifique se o site está servido via **HTTPS** (obrigatório para PWA).
    *   Verifique se o `manifest.webmanifest` está carregando corretamente (aba "Application" > "Manifest" no DevTools).
    *   O navegador pode ter bloqueado o prompt se o usuário o dispensou recentemente (lógica implementada em `PwaInstallPrompt`).

*   **Ícones não aparecem**:
    *   Verifique os caminhos em `manifest.webmanifest`.
    *   Certifique-se de que os arquivos existem em `public/icons/`.

*   **App não funciona offline**:
    *   Verifique se o Service Worker está registrado (aba "Application" > "Service Workers").
    *   Verifique se o cache está sendo preenchido (aba "Application" > "Cache Storage").
