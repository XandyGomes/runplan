# 🏃 RunPlan - Planos de Corrida Personalizados

![RunPlan Banner](https://runplan-beige.vercel.app/logo.png)

> **RunPlan** é uma plataforma de treinamento de corrida que gera **planos periodizados** (base → construção → pico → polimento) a partir do seu objetivo de prova, nível e disponibilidade — sincronizado com o **Strava** para acompanhar automaticamente cada treino concluído.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://runplan-beige.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Strava API](https://img.shields.io/badge/Strava-API-FC4C02?style=for-the-badge&logo=strava)](https://developers.strava.com)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

---

## ✨ Funcionalidades Principais

### 📅 Motor de Plano Periodizado
Gera um plano de treino completo (6 a 26 semanas) para a distância da prova escolhida:
- Progressão de volume automática (~10%/semana) com semana de descarga a cada 4 semanas.
- Fases de treino (base, construção, pico, polimento) que ajustam intensidade e tipos de treino ao longo do plano.
- Treino de força complementar intercalado com as corridas.

### 🏠 Tela "Hoje"
- Faixa semanal com indicador de progresso e treino do dia colorido por tipo (leve, intervalado, longão, força...).
- Tela dedicada de dia de descanso.
- Visão geral da semana com exercícios e distância total.

### 🗓️ Calendário
- Visão por semana (com opção de redefinir uma semana específica) e visão mensal.
- Vínculo automático com atividades do Strava para marcar treinos como concluídos.

### 🤖 Resumo de Treino com IA
Cada treino recebe um resumo gerado por IA explicando o objetivo e como executá-lo — a distância e o ritmo vêm sempre do motor determinístico, nunca da IA, para garantir números confiáveis.

### 📲 PWA Instalável
Funciona como app instalável direto do navegador (Android/iOS), com ícone próprio e tela cheia sem barra de navegador.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** Vanilla CSS com [CSS Modules](https://github.com/css-modules/css-modules)
- **Banco de dados:** [Supabase](https://supabase.com/) (Postgres)
- **IA:** [Google Gemini](https://ai.google.dev/) & [Groq](https://groq.com/) (fallback automático)
- **Integração:** [Strava OAuth 2.0](https://developers.strava.com/docs/authentication/)

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

---

## 🎨 Visual do Aplicativo

Dark mode com paleta verde-água → azul, cards em glassmorphism e cores dedicadas por tipo de treino (leve, intervalado, longão, força, prova) — a mesma linguagem visual usada no calendário, no card do dia e no ícone do app.

---

## 👨‍💻 Desenvolvido por
**Xandy Gomes** - *Inovação e Performance*

---

## 📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
