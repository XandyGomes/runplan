import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Stub de checkout de assinatura. Cobrança real exige uma conta Stripe do usuário:
 * configure STRIPE_SECRET_KEY e implemente a criação da sessão de checkout aqui
 * quando as chaves estiverem disponíveis.
 */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        status: 'not_configured',
        message: 'Assinatura ainda não configurada. Peça para o desenvolvedor configurar o Stripe para ativar a cobrança.',
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
