# ⚡ Casal Avalanche • Gestão Financeira Inteligente (PWA Mobile-First)

Aplicação web completa e responsiva desenvolvida em **Next.js (App Router)** com **TypeScript**, **Tailwind CSS**, **Prisma ORM (Neon PostgreSQL)**, **NextAuth** e **Recharts**.

Projetada sob medida para o uso diário no celular por um casal (**Lucas & Mariana**), com foco na **quitação acelerada de dívidas e empréstimos através do Método Avalanche** e na subsequente construção da **Reserva de Emergência**.

---

## 🌟 Principais Funcionalidades

### 1. Sistema de Usuários e "Pote Único"
- **Rastreabilidade Total:** Todo lançamento (receita, despesa, amortização ou aporte) registra obrigatoriamente quem executou a ação (`userId`), com foto e nome.
- **Pote Único Inteligente:** As receitas líquidas somam-se para pagar os compromissos do casal, mantendo a visibilidade de quanto cada um trouxe e quanto cada um gastou.
- **Alternador de Perfil em 1 Clique:** No topo do app, é possível alternar instantaneamente entre os perfis de Lucas e Mariana.

### 2. Carteiras Separadas & Meios de Pagamento (Nunca se misturam!)
- **Carteira Livre (Conta Corrente / Pix / Débito):**
  - Alimentada pelo Salário Líquido + Bônus + Renda Extra.
  - Paga Gastos Fixos, Empréstimos, Faturas de Cartão e Gastos no Débito/Pix.
  - Calcula a **Sobra Projetada do Mês** para amortização.
- **Carteira de Benefícios (VR & VA):**
  - Alimentada exclusivamente pelas entradas de Vale Refeição e Vale Alimentação.
  - Utilizada estritamente para gastos variáveis de alimentação (Mercado, Açougue/Mistura, Doces/Padaria, Comer Fora/Delivery).
  - Barras visuais de consumo mostram o saldo restante de VR e VA em tempo real.
- **Cartão de Crédito:**
  - Registra a data da compra e consolida a fatura mensal que impactará o fluxo da Carteira Livre no vencimento.

### 3. Motor do Método Avalanche (Foco Principal em Quitação)
- **Ordenação Automática:** Empréstimos ativos são organizados da **maior taxa de juros mensal para a menor**.
- **Alvo Atual de Ataque:** Destaque visual pulsante no empréstimo com a taxa mais alta (ex: Empréstimo Nubank a 4,85% a.m.).
- **Calculadora de Amortização Extraordinária:**
  - Registro de pagamentos extras com abatimento de juros.
  - Opção entre **Reduzir Prazo** (elimina parcelas do final do contrato) ou **Reduzir Parcela** (recalcula a parcela mensal).
  - Simulação em tempo real do novo saldo devedor e estimativa de economia futura de juros.
  - Animação de confetes ao zerar qualquer contrato!

### 4. Meta Pós-Dívidas: Reserva de Emergência
- Cálculo automático do **Custo de Vida Mensal do Casal** (Gastos Fixos + Média de Gastos Variáveis essenciais).
- Metas escalonadas:
  - **3 meses:** Colchão mínimo de segurança.
  - **6 meses:** Meta ideal recomendada para o casal.
  - **12 meses:** Independência e blindagem total.
- Termômetro visual de progresso e modal para registro de novos aportes.

### 5. Experiência Mobile-First (PWA)
- **Bottom Navigation Bar:** Acesso rápido a Visão Geral, Extrato, Avalanche e Fixos & Reserva.
- **Botão Flutuante (FAB "+"):** Bottom Sheet ultra-rápido para lançar despesas e receitas em menos de 10 segundos com atalhos de 1 clique (Mercado no VA, Mistura no VA, Doces no VR, Comer Fora no VR, Farmácia no Pix, Combustível no Crédito).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Estilização:** Tailwind CSS v4, Glassmorphism, CSS Variables
- **Banco de Dados:** Neon Serverless PostgreSQL (ou fallback simulado automático)
- **ORM:** Prisma ORM 6 (PostgreSQL) com suporte a `Decimal` e tipagem estrita
- **Autenticação:** NextAuth.js (Auth.js) com suporte a credenciais e Google
- **Gráficos:** Recharts (Rosca de despesas variáveis, Barras de participação do casal)
- **Datas & Moeda:** `date-fns` (pt-BR) e `Intl.NumberFormat` (BRL - R$)
- **Celebração:** `canvas-confetti`

---

## 🚀 Como Executar o Projeto Localmente

### 1. Entrar na pasta do projeto:
```bash
cd C:\Users\laura\.gemini\antigravity-ide\scratch\financas-casal
```

### 2. Instalar dependências (caso necessário):
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse a aplicação no navegador em: **`http://localhost:3000`**

---

## 🐘 Conexão com o Neon (Serverless PostgreSQL)

O projeto possui arquitetura híbrida: funciona imediatamente com dados mockados em `localStorage` para testes instantâneos, e conecta-se diretamente ao Neon quando configurado:

1. No console do [Neon](https://neon.tech), crie um banco de dados PostgreSQL e copie a Connection String (`DATABASE_URL`).
2. Edite o arquivo `.env` na raiz do projeto:
   ```env
   DATABASE_URL="postgresql://neondb_owner:SENHA@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Sincronize as tabelas no Neon:
   ```bash
   npm run db:push
   ```
4. Popule o banco com o seed inicial do casal:
   ```bash
   npm run db:seed
   ```
5. Para visualizar as tabelas pelo navegador:
   ```bash
   npm run db:studio
   ```

---

## ☁️ Deploy na Vercel (com GitHub)

1. Crie um repositório no seu GitHub e suba o código:
   ```bash
   git add .
   git commit -m "feat: Casal Avalanche initial release"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/financas-casal.git
   git push -u origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Nas **Environment Variables** da Vercel, adicione:
   - `DATABASE_URL`: URL do Neon PostgreSQL.
   - `NEXTAUTH_SECRET`: Uma chave secreta qualquer (ex: gere com `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: A URL do seu app na Vercel (ex: `https://financas-casal.vercel.app`).
4. Clique em **Deploy**. A Vercel executará o `npm run build` automaticamente!
