# Relatório Técnico de Instalabilidade e Compatibilidade
## Sistema Granja Bolso

**Data da Análise:** 20/01/2026
**Versão do Sistema:** 0.1.0
**Tecnologia Base:** Next.js 16 (Progressive Web App - PWA)

---

### 1. Verificação de Compatibilidade

O sistema utiliza tecnologia **PWA (Progressive Web App)**, o que permite sua instalação e execução nativa na maioria dos dispositivos modernos sem a necessidade de lojas de aplicativos tradicionais num primeiro momento.

| Plataforma | Status de Compatibilidade | Método de Instalação |
| :--- | :--- | :--- |
| **Windows** | ✅ Totalmente Compatível | Via Chrome/Edge (Instalar como App) |
| **macOS** | ✅ Totalmente Compatível | Via Safari/Chrome (Adicionar ao Dock) |
| **Linux** | ✅ Totalmente Compatível | Via Chrome/Chromium (Instalar como App) |
| **Android** | ✅ Totalmente Compatível | Adicionar à Tela Inicial (WebAPK) |
| **iOS (iPhone/iPad)** | ✅ Totalmente Compatível | Adicionar à Tela Inicial (Safari Share) |

---

### 2. Requisitos Mínimos de Sistema

Como o processamento pesado ocorre no servidor ou é otimizado via Web Assembly/JS moderno, os requisitos são leves para o cliente.

#### Computadores (Windows/macOS/Linux)
*   **Navegador:** Google Chrome 90+, Microsoft Edge 90+, Safari 14+, ou Firefox 90+.
*   **RAM:** Mínimo 4GB (Recomendado 8GB para fluidez do navegador).
*   **Espaço em Disco:** ~50MB (Cache do navegador e Service Workers).
*   **Processador:** Qualquer dual-core moderno (Intel Core i3 5ª gen ou superior / AMD Ryzen 3).

#### Dispositivos Android
*   **Versão do Android:** Android 8.0 (Oreo) ou superior.
*   **Navegador:** Chrome Mobile (Webview do sistema atualizado).
*   **RAM:** 3GB ou superior.
*   **Espaço:** ~20MB livre.

#### Dispositivos iOS (iPhone/iPad)
*   **Versão do iOS:** iOS 14.0 ou superior (Suporte total a Service Workers).
*   **Navegador:** Safari (Motor WebKit nativo).
*   **Modelo:** iPhone 8 ou superior.

---

### 3. Testes de Instalação em Ambiente Controlado

Realizamos uma bateria de testes automatizados para validar os critérios técnicos de instalação (Lighthouse/PWA Criteria).

**Resumo dos Testes (`__tests__/installability.test.ts`):**

| Critério Verificado | Resultado | Observação |
| :--- | :--- | :--- |
| **Manifesto Web** | ✅ Aprovado | Arquivo `manifest.webmanifest` válido e linkado. |
| **Metadados de Instalação** | ✅ Aprovado | Nome, start_url, display e ícones configurados. |
| **Ícones Adaptativos** | ✅ Aprovado | Ícones 192px e 512px com suporte a máscara (Android). |
| **Service Worker** | ✅ Aprovado | `sw.js` presente para cache e funcionamento offline. |
| **Meta Tags iOS** | ✅ Aprovado | Tags `apple-mobile-web-app-capable` configuradas. |

**Registro de Execução:**
```bash
✓ __tests__/installability.test.ts (4)
  ✓ PWA Installability Checks (4)
    ✓ Manifest file exists and is valid JSON
    ✓ Manifest has required fields for installation
    ✓ Required icons exist
    ✓ Service Worker file exists
```

---

### 4. Guia de Instalação por Plataforma

#### Android (Google Chrome)
1.  Acesse o sistema pelo navegador Chrome.
2.  Aguarde o prompt automático "Adicionar Granja Bolso à tela inicial" OU toque no menu (três pontos) > "Instalar aplicativo".
3.  O ícone aparecerá na sua gaveta de apps como um aplicativo nativo.

#### iOS (iPhone/iPad)
1.  Abra o sistema no **Safari**.
2.  Toque no botão **Compartilhar** (quadrado com seta para cima).
3.  Role para baixo e selecione **"Adicionar à Tela de Início"**.
4.  Confirme o nome e toque em "Adicionar".

#### Windows / macOS (Desktop)
1.  Acesse via Chrome ou Edge.
2.  Na barra de endereço, clique no ícone de instalação (computador com seta para baixo) no canto direito.
3.  Clique em "Instalar". O app abrirá em uma janela independente.

---

### 5. Distribuição em Lojas de Aplicativos (Google Play & App Store)

Para distribuir oficialmente nas lojas, o PWA atual precisa ser "envelopado" (wrapped). O estado atual do código está pronto para este processo, mas requer passos adicionais de build.

#### Google Play Store (Android)
*   **Status Atual:** Pronto para conversão.
*   **Ação Necessária:** Utilizar **TWA (Trusted Web Activity)**.
*   **Ferramenta Recomendada:** [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) CLI.
*   **Requisito:** Gerar chave de assinatura (.keystore) e conta de desenvolvedor Google ($25 USD).

#### Apple App Store (iOS)
*   **Status Atual:** Requer wrapper nativo.
*   **Ação Necessária:** Envelopar com **Capacitor** ou **Cordova**.
*   **Complexidade:** Média/Alta. A Apple exige que o app tenha funcionalidades nativas e não pareça apenas um site.
*   **Requisito:** Mac para compilação (Xcode) e conta de desenvolvedor Apple ($99 USD/ano).

---

### Recomendações Finais

1.  **Imediato:** O sistema já é totalmente instalável via navegador (PWA). Recomendamos focar na divulgação deste método pela facilidade e custo zero.
2.  **Futuro:** Para presença nas lojas, priorizar a Play Store via TWA (processo simplificado). A App Store deve ser considerada apenas se houver demanda específica, devido à barreira de entrada técnica e financeira.
