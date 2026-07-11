# 🏃 RunPlan — Planos de Corrida Periodizados com IA

![RunPlan Banner](https://runplan-beige.vercel.app/logo.png)

> **RunPlan** gera planos de treino de corrida **periodizados e cientificamente embasados** a partir do seu objetivo de prova, nível e disponibilidade, sincronizados com o **Strava**. Um motor determinístico garante que a progressão de volume seja sempre segura; a mesma IA usada no [Aura Run](https://github.com/XandyGomes/aura-run) (Gemini/Groq) revisa o plano como um treinador revisaria um rascunho — nunca inventa números, só analisa e personaliza.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://runplan-beige.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Strava API](https://img.shields.io/badge/Strava-API-FC4C02?style=for-the-badge&logo=strava)](https://developers.strava.com)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://runplan-beige.vercel.app)

---

## 🎯 O problema que resolve

A maioria dos apps de corrida "com IA" pede pra um modelo de linguagem inventar uma planilha de treino do zero — e LLMs são notoriamente ruins em aritmética consistente ao longo de várias semanas (datas erradas, saltos de volume perigosos, progressão sem lógica). O RunPlan separa as duas responsabilidades:

- **Motor determinístico** (`src/lib/planEngine.ts`) calcula datas, volumes e progressão — sempre correto, sempre auditável, sempre seguro.
- **IA** entra só onde IA é boa de verdade: julgamento, personalização e comunicação — revisando o plano já calculado e escrevendo uma devolutiva real de treinador.

---

## ✨ Funcionalidades Principais

### 📅 Motor de Plano Periodizado
Gera um plano completo (4 a 26 semanas) seguindo regras reais de periodização esportiva:
- **Progressão de volume limitada a ~8%/semana** (versão conservadora da "regra dos 10%") — nunca estica o plano até uma meta ideal se o prazo não permitir com segurança.
- **Treino longo com progressão própria**, independente do volume dos outros dias — é ele que define se o atleta completa a distância da prova, então cresce mais rápido (aditivo, ~2km/semana) enquanto os dias de apoio sobem de forma conservadora. Validado contra os planos de meia maratona mais usados do mundo ([Hal Higdon](https://www.halhigdon.com/training/half-marathon-training/)): pico de longão entre 76% e 90% da distância da prova, igual aos programas Novice/Intermediate dele.
- **Semana de descarga a cada 4 semanas** (padrão 3:1) sem travar a tendência de crescimento das semanas seguintes.
- **Fases de treino** (base → construção → pico → polimento) que ajustam intensidade e tipos de treino ao longo do plano.
- Avaliação transparente: se o prazo é curto demais pro volume ideal, o app avisa e explica como abordar a prova com segurança, em vez de fingir que está tudo certo.

### 🧠 IA híbrida: números confiáveis + julgamento de treinador real
Depois do motor calcular o plano, a IA revisa como um treinador revisaria um rascunho:
- Avalia se o volume de pico é adequado pra distância da prova.
- O atleta pode contar contexto livre no onboarding (lesão, restrição, objetivo específico) e a IA incorpora isso na devolutiva com conselho prático — não um texto genérico.
- Cada treino individual recebe um resumo gerado por IA explicando o objetivo e como executá-lo.

### 💪 Treino de força com instruções de verdade
Cada sessão de força (corpo inteiro / pernas e core / mobilidade) traz 6 exercícios específicos pra corredor, com séries/repetições, dica de execução e ícone ilustrativo — sem equipamento, foco em prevenção de lesão (glúteo, core, panturrilha, mobilidade de quadril).

### 🏠 Tela "Hoje" & 🗓️ Calendário
Faixa semanal colorida por tipo de treino, dia de descanso dedicado, visão geral da semana, calendário semanal/mensal com opção de redefinir uma semana específica, e vínculo automático com atividades do Strava pra marcar treinos como concluídos.

### 📲 PWA Instalável
Funciona como app instalável direto do navegador (Android/iOS), com ícone próprio e tela cheia sem barra de navegador.

---

## 🛠️ Tech Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Linguagem | [TypeScript](https://www.typescriptlang.org/) (strict) |
| Estilização | Vanilla CSS com [CSS Modules](https://github.com/css-modules/css-modules) |
| Banco de dados | [Supabase](https://supabase.com/) (Postgres) |
| IA | [Google Gemini](https://ai.google.dev/) & [Groq](https://groq.com/) — fallback automático entre provedores |
| Integração | [Strava OAuth 2.0](https://developers.strava.com/docs/authentication/) |
| Deploy | [Vercel](https://vercel.com/) |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- Uma conta no [Strava Developers](https://developers.strava.com/) para as credenciais de API
- Um projeto no [Supabase](https://supabase.com/)
- Chave de API do [Groq](https://console.groq.com/) ou [Google AI Studio](https://aistudio.google.com/)

### Instalação

```bash
git clone https://github.com/XandyGomes/runplan.git
cd runplan
npm install
```

Copie `.env.local.example` para `.env.local` e preencha as chaves. Depois rode `supabase/schema.sql` no SQL Editor do seu projeto Supabase para criar as tabelas.

```bash
npm run dev
```

Detalhes de configuração mais avançados (reaproveitar credenciais entre projetos, variáveis na Vercel) estão em [DEVELOPMENT.md](DEVELOPMENT.md).

---

## 🎨 Visual do Aplicativo

Dark mode com paleta verde-água → azul, cards em glassmorphism e cores dedicadas por tipo de treino (leve, intervalado, longão, força, prova) — a mesma linguagem visual usada no calendário, no card do dia e no ícone do app.

---

## 👨‍💻 Desenvolvido por
**Xandy Gomes** - *Inovação e Performance*

---

## 📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
