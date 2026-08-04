# 🎟️ TechBildAcess

**Plataforma completa de venda, gestão e validação de ingressos online** para estabelecimentos e eventos.
Vender ingressos, controlar lotes, gerar QR Codes únicos e fazer check-in na portaria — tudo em um só lugar.

Interface **premium, minimalista e tecnológica**, mobile-first e instalável como **PWA**.

---

## ✨ Funcionalidades

O sistema tem **3 áreas**:

### 👤 Área do Cliente
- Página inicial e catálogo de eventos publicados
- Página detalhada do evento com seleção de lote, tipo (Pista, VIP, Camarote, Mesa, Área especial) e quantidade
- Carrinho, resumo, **aplicação de cupom** e identificação do comprador
- Confirmação de pedido e geração de ingresso digital
- **Carteira de ingressos** com **QR Code único por ingresso**
- Status do ingresso: Ativo, Usado, Cancelado, Expirado
- Histórico de compras, perfil e compartilhamento de ingresso

### 🛠️ Painel Administrativo (`/admin`)
- **Dashboard** com receita, ingressos vendidos, check-ins, clientes e gráficos
- **Eventos** — CRUD, publicar/despublicar, upload de banner (Supabase Storage)
- **Lotes** — preço, quantidade, datas, limite por comprador, encerramento automático
- **Ingressos** — filtros, ver QR, cancelar/reativar/marcar como usado, exportar CSV
- **Clientes** — histórico, eventos frequentados, total gasto
- **Cupons** — porcentagem ou valor fixo, por evento ou global, limite de uso e validade
- **Convidados** — lista VIP com QR gratuito
- **Fiscais** — cadastro de equipe de portaria por evento
- **Financeiro** — receita por evento, ticket médio, exportação
- **Relatórios** — vendas por período, check-ins por horário, eventos mais vendidos, taxa de comparecimento
- **Configurações** — nome, logo, cor, dados do estabelecimento e políticas

### 🔎 Área do Fiscal / Check-in (`/fiscal`)
- Seleção do evento permitido
- **Scanner de QR Code pela câmera** + validação manual
- Resultado em tempo real: Válido, Já usado, Cancelado, Inválido, Evento incorreto, Expirado
- Marca o ingresso como usado, salva horário e fiscal responsável, e impede reutilização
- Interface grande e objetiva para uso na portaria

---

## 🧰 Tecnologias

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** (tema escuro premium)
- **Supabase** — PostgreSQL, Auth (Google OAuth), Storage
- **React Router**
- **qrcode** (geração) + **html5-qrcode** (leitura pela câmera)
- **Recharts** (gráficos), **Sonner** (notificações), **lucide-react** (ícones)
- **PWA** instalável (`vite-plugin-pwa`)

---

## 🚀 Como instalar e rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Opcional: configurar Supabase
cp .env.example .env
# Sem VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY, o app usa armazenamento local.

# 3. Rodar em desenvolvimento
npm run dev
# abre em http://localhost:5173

# 4. Build de produção
npm run build
npm run preview
```

### Armazenamento local

O TechBildAcess opera em modo local por padrão. Eventos, lotes, pedidos, ingressos, check-ins,
configurações e banners são gravados no `localStorage` do navegador deste
computador. Use **Entrar no modo local** para acessar o painel administrativo.

Esse modo é apropriado para uso offline, demonstrações e operação em uma única
máquina/navegador. Os dados não são compartilhados entre dispositivos e podem
ser apagados ao limpar os dados do navegador. Para acesso por várias pessoas ou
backup centralizado, configure o Supabase normalmente e defina `VITE_STORAGE_MODE=supabase`.

---

## 🗄️ Configuração do Supabase

### 1. Criar o projeto
Crie um projeto novo em [supabase.com](https://supabase.com).

### 2. Aplicar as migrations
No painel do Supabase → **SQL Editor**, rode **na ordem**:

1. `supabase/migrations/0001_init.sql` — tabelas, funções, triggers e RPCs
2. `supabase/migrations/0002_rls.sql` — políticas de segurança (RLS)
3. `supabase/migrations/0003_storage.sql` — bucket de banners de eventos

> Alternativa com a **Supabase CLI**: `supabase db push`.

### 3. Pegar as chaves
Em **Settings → API**, copie `Project URL` e a chave `anon` / `publishable` para o `.env`.

---

## 🔐 Configurar Google OAuth

1. No **Google Cloud Console**, crie um **OAuth 2.0 Client ID** (tipo *Web*).
2. Em **Authorized redirect URIs**, adicione:
   ```
   https://<SEU-PROJETO>.supabase.co/auth/v1/callback
   ```
3. No Supabase → **Authentication → Providers → Google**, cole o **Client ID** e **Client Secret** e ative.
4. Em **Authentication → URL Configuration**, adicione suas URLs em **Redirect URLs**:
   ```
   http://localhost:5173/login
   https://SEU-DOMINIO/login
   ```

---

## 👑 Administradores autorizados

O acesso admin é reconhecido **por e-mail**, validado tanto no frontend (`VITE_ADMIN_EMAILS`)
quanto no banco (função `is_admin()` nas migrations):

- `igoraguiarviana@gmail.com`
- `techbilld@gmail.com`
- `igor.vianaaidev@gmail.com`

Para alterar, edite `VITE_ADMIN_EMAILS` no `.env` **e** a função `public.is_admin()` em `0001_init.sql`.

Fiscais são reconhecidos automaticamente quando o admin os cadastra em **Admin → Fiscais** com o mesmo e-mail usado no login Google.

---

## 🔒 Segurança (RLS)

- Cada usuário lê/edita **apenas o próprio perfil**, pedidos e ingressos.
- Admin (por e-mail) gerencia tudo.
- Fiscal só valida os eventos vinculados ao seu e-mail.
- Eventos publicados e lotes ativos são públicos; rascunhos não.
- **Preço e regras de venda validados no servidor** via RPC `create_order` (não é possível alterar preço pelo frontend).
- Check-in via RPC `check_in_ticket` — só admin/fiscal autorizado; **QR não pode ser reutilizado**.
- Funções auxiliares no banco: `is_admin()`, `is_fiscal_for()`, `can_validate_event()`.

---

## 🌐 Variáveis de ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173
VITE_ADMIN_EMAILS=igoraguiarviana@gmail.com,techbilld@gmail.com,igor.vianaaidev@gmail.com
```

---

## ☁️ Deploy (Vercel / Netlify)

1. Importe o repositório.
2. Build command: `npm run build` · Output: `dist`
3. Configure as variáveis de ambiente (as mesmas do `.env`).
4. Adicione a URL de produção nas **Redirect URLs** do Supabase e no Google OAuth.
5. Como é uma SPA, garanta o fallback de rotas para `index.html`
   (Vercel já faz automaticamente; no Netlify use um `_redirects` com `/* /index.html 200`).

---

## 🗺️ Rotas

| Área | Rotas |
|------|-------|
| Pública | `/`, `/eventos`, `/evento/:id`, `/login` |
| Cliente | `/app`, `/app/meus-ingressos`, `/app/ingresso/:id`, `/app/historico`, `/app/perfil` |
| Admin | `/admin`, `/admin/eventos`, `/admin/lotes`, `/admin/ingressos`, `/admin/clientes`, `/admin/cupons`, `/admin/convidados`, `/admin/fiscais`, `/admin/financeiro`, `/admin/relatorios`, `/admin/configuracoes` |
| Fiscal | `/fiscal`, `/fiscal/checkin`, `/fiscal/historico` |

---

## 🧱 Estrutura

```
TechBildAcess/
├─ supabase/migrations/     # SQL: schema, RLS, storage
├─ src/
│  ├─ components/           # UI kit, layouts, guards
│  ├─ context/              # Auth e Cart
│  ├─ lib/                  # supabase client, tipos, utils, queries
│  └─ pages/                # public / client / admin / fiscal
└─ public/                  # ícones PWA, manifest
```

---

## 🔮 Preparado para o futuro
A estrutura já contempla (a integrar): pagamento online real, área VIP/camarotes, mesas numeradas,
mapa de setores, programa de fidelidade/cashback, pré-venda exclusiva, revenda autorizada,
pulseira NFC, notificações promocionais e multiestabelecimento.

---

© TechBildAcess — Plataforma de ingressos online.
