import { NextResponse } from 'next/server';
import { getStravaAuthUrl } from '@/lib/strava';

export async function GET() {
  try {
    return NextResponse.redirect(getStravaAuthUrl());
  } catch (error: any) {
    return new NextResponse(`Erro ao gerar URL de autenticação do Strava: ${error.message}`, { status: 500 });
  }
}
