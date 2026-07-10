# Notas de desenvolvimento

Notas práticas de configuração local que não cabem no README público.

## Supabase — dá pra reaproveitar um projeto que você já tenha

Não precisa criar um projeto novo: o RunPlan usa as tabelas `profiles`, `plans` e `workouts`. Se você já tem outro projeto Supabase (de outro app seu) e os nomes de tabela não colidem, é só rodar `supabase/schema.sql` no SQL Editor desse mesmo projeto e usar o `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` dele.

## Strava — pode reaproveitar para testar, mas crie um app próprio antes de produção

O Strava permite só **1 aplicativo por conta** na tela de auto-cadastro (`strava.com/settings/api`). Reaproveitar o `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` de outro app seu funciona sem problema para desenvolvimento local (o Strava sempre libera `localhost` como callback, independente do domínio cadastrado no app). Desde junho de 2026 a Strava também exige assinatura paga por conta de desenvolvedor para acesso à API — mais um motivo para reaproveitar o mesmo app em vez de criar um novo.

Desvantagens de manter dois projetos no mesmo app do Strava a longo prazo: dividem o mesmo limite de requisições, e a tela de autorização mostra o nome do app original mesmo ao logar em outro projeto. Ao publicar de verdade, ajuste o **Authorization Callback Domain** desse app para o domínio de produção (ex: `seu-projeto.vercel.app`) — sem `https://`, só o domínio.

## Variáveis de ambiente na Vercel

```bash
npx vercel env add NEXT_PUBLIC_APP_URL production
```

Defina sempre `NEXT_PUBLIC_APP_URL` com o domínio estável do projeto (ex: `https://runplan-beige.vercel.app`), nunca deixe o `redirect_uri` do Strava depender do `VERCEL_URL` automático — ele muda a cada deploy.

## Cobrança / paywall

Não há Stripe implementado. O desbloqueio de Premium sem cobrança real exige o código em `PREMIUM_UNLOCK_CODE` (ver `.env.local.example`), pra evitar que qualquer visitante da URL pública se dê acesso sozinho.
