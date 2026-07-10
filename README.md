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
Gera um plano de treino completo (6 a 26 semanas) para a distância da prova escolhida, seguindo regras reais de periodização usadas por treinadores:
- Progressão de volume limitada a ~8%/semana (regra dos 10% conservadora) — nunca "estica" o plano até uma meta ideal se o prazo disponível não permitir com segurança.
- Semana de descarga a cada 4 semanas (padrão 3:1), sem travar a tendência de crescimento das semanas seguintes.
- Fases de treino (base, construção, pico, polimento) que ajustam intensidade, tipos de treino e proporção do treino longo ao longo do plano.
- Data da prova é usada exatamente como informada, e o plano sempre começa cobrindo o dia de hoje.
- Treino de força complementar intercalado com as corridas.

### 🧠 IA híbrida: números confiáveis + julgamento de treinador real
O motor determinístico acima cuida de tudo que precisa ser **sempre correto** (datas, distâncias, progressão segura). Depois de calcular o plano, a mesma IA usada no [Aura Run](https://github.com/XandyGomes/aura-run) (Gemini/Groq, com fallback automático) **revisa o plano inteiro como um treinador revisando um rascunho**:
- Avalia se o volume de pico é adequado para a distância da prova e avisa quando o prazo é curto demais para o ideal, com orientação real de como abordar a prova com segurança.
- O atleta pode contar contexto livre no onboarding (lesão, restrição, objetivo específico) e a IA incorpora isso na devolutiva, com conselho prático — não um texto genérico.
- A IA nunca inventa números: ela só analisa e comenta os que o motor determinístico já validou como seguros.
- Cada treino individual também recebe um resumo gerado por IA explicando o objetivo e como executá-lo.

### 🏠 Tela "Hoje"
- Faixa semanal com indicador de progresso e treino do dia colorido por tipo (leve, intervalado, longão, força...).
- Tela dedicada de dia de descanso.
- Visão geral da semana com exercícios e distância total.

### 🗓️ Calendário
- Visão por semana (com opção de redefinir uma semana específica) e visão mensal.
- Vínculo automático com atividades do Strava para marcar treinos como concluídos.

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
