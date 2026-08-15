![TrustSiteMonitor](https://trustsitemonitor.com/assets/images/logo.png)

# 🔴 Relatório de Segurança — https://www.granjadebolso.online
**Data da auditoria:** 2026-07-01 23:43 UTC
**Status geral:** 🔴 Critico
**Tecnologias detectadas:** Vercel

---

## Sumário Executivo
| Severidade | Quantidade |
|---|---|
| 🔴 Crítico  | 7 |
| 🟠 Moderado | 0 |
| 🟡 Atenção  | 5 |
| ✅ Seguro   | 0 |
| **Total** | **12** |

## Vulnerabilidades Detalhadas

### 🟡 #1 — CSP ausente — vulnerável a XSS
**Severidade:** Atencao
**Descrição:** Sem Content-Security-Policy — o site está vulnerável a ataques XSS (Cross-Site Scripting) e injeção de conteúdo malicioso.
**Correção:**
```
Adicionar: Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

### 🟡 #2 — Clickjacking — X-Frame-Options ausente
**Severidade:** Atencao
**Descrição:** Sem proteção contra Clickjacking — o site pode ser embutido em iframes maliciosos para enganar usuários.
**Correção:**
```
Adicionar: X-Frame-Options: SAMEORIGIN (ou usar CSP frame-ancestors 'self')
```

### 🟡 #3 — MIME Sniffing — X-Content-Type-Options ausente
**Severidade:** Atencao
**Descrição:** Sem proteção contra MIME sniffing — browsers podem executar arquivos como um tipo diferente do declarado.
**Correção:**
```
Adicionar: X-Content-Type-Options: nosniff
```

### 🟡 #4 — Referrer-Policy ausente — vazamento de URL
**Severidade:** Atencao
**Descrição:** Sem Referrer-Policy — URLs com tokens de sessão, IDs ou dados sensíveis podem vazar para sites terceiros via header Referer.
**Correção:**
```
Adicionar: Referrer-Policy: strict-origin-when-cross-origin
```

### 🟡 #5 — Permissions-Policy ausente
**Severidade:** Atencao
**Descrição:** Sem Permissions-Policy — o site não restringe acesso a recursos sensíveis do browser como câmera, microfone e geolocalização.
**Correção:**
```
Adicionar: Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### 🔴 #6 — Sem proteção contra brute force no login
**Severidade:** Critico
**Descrição:** O endpoint '/api/auth/login' aceitou 6 tentativas de autenticação consecutivas sem retornar HTTP 429 — vulnerável a ataques de força bruta e credential stuffing.
**Evidência:**
```
6 requisições POST para https://www.granjadebolso.online/api/auth/login
Respostas: 403, 403, 403, 403, 403, 403 — nenhuma foi 429 (Too Many Requests).
```
**Correção:**
```
Implementar rate limiting: máx. 3-5 tentativas por minuto por IP+usuário.
Em .NET: usar o pacote AspNetCoreRateLimit ou middleware customizado.
No Nginx: limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;
Adicionar CAPTCHA após 3 tentativas e bloqueio temporário após 5.
```

### 🔴 #7 — Elasticsearch cluster exposto (porta 9300)
**Severidade:** Critico
**Descrição:** Porta de comunicação entre nós do Elasticsearch exposta — pode permitir injeção no cluster.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:9300 — porta acessível publicamente da internet.
```
**Correção:**
```
Restringir no firewall para comunicação apenas entre nós do cluster.
```

### 🔴 #8 — Docker API sem TLS exposta (porta 2375)
**Severidade:** Critico
**Descrição:** Docker daemon exposto sem TLS — permite controle total do servidor, escalonamento de privilégios e acesso root ao host.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:2375 — porta acessível publicamente da internet.
```
**Correção:**
```
Desabilitar imediatamente. NUNCA expor o Docker daemon sem TLS.
Se precisar de acesso remoto, usar TLS mútuo ou SSH tunneling.
```

### 🔴 #9 — Elasticsearch HTTP exposto (porta 9200)
**Severidade:** Critico
**Descrição:** Elasticsearch acessível da internet via HTTP — expõe todos os índices e dados sem autenticação.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:9200 — porta acessível publicamente da internet.
```
**Correção:**
```
Restringir no firewall. Habilitar autenticação no elasticsearch.yml: xpack.security.enabled: true.
```

### 🔴 #10 — PostgreSQL exposto (porta 5432)
**Severidade:** Critico
**Descrição:** PostgreSQL acessível diretamente da internet — banco de dados deve ser acessível apenas internamente.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:5432 — porta acessível publicamente da internet.
```
**Correção:**
```
Restringir no firewall para acesso apenas por IPs internos.
No pg_hba.conf: usar host/hostssl com IPs específicos.
```

### 🔴 #11 — Memcached exposto (porta 11211)
**Severidade:** Critico
**Descrição:** Memcached acessível da internet — sem autenticação nativa, amplamente explorado em ataques DDoS de amplificação.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:11211 — porta acessível publicamente da internet.
```
**Correção:**
```
Bloquear no firewall imediatamente. Adicionar -l 127.0.0.1 nos parâmetros de inicialização.
```

### 🔴 #12 — RabbitMQ AMQP exposto (porta 5672)
**Severidade:** Critico
**Descrição:** Porta AMQP do RabbitMQ acessível da internet — filas de mensagens devem ser internas.
**Evidência:**
```
Conexão TCP bem-sucedida para www.granjadebolso.online:5672 — porta acessível publicamente da internet.
```
**Correção:**
```
Restringir no firewall: iptables -I INPUT -p tcp --dport 5672 -j DROP
No Docker: não expor 5672 para 0.0.0.0.
```

## Proteções identificadas

- Chaves de API expostas no bundle JS: ✅ Nenhuma encontrada

---
*Auditoria automatizada por TrustSiteMonitor — 2026-07-01 23:43 UTC*
