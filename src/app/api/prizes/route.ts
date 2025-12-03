import { NextRequest, NextResponse } from 'next/server';

// Tipos de prêmios
interface Prize {
  id: number;
  name: string;
  emoji: string;
  probability: number;
  color: string;
}

// Configuração padrão dos prêmios (inicial)
const defaultPrizes: Prize[] = [
  { id: 1, name: 'Vale R$ 500', emoji: '💰', probability: 5, color: 'from-yellow-400 to-yellow-600' },
  { id: 2, name: 'Vale R$ 300', emoji: '🎁', probability: 8, color: 'from-red-400 to-red-600' },
  { id: 3, name: 'Vale R$ 200', emoji: '🎄', probability: 10, color: 'from-green-400 to-green-600' },
  { id: 4, name: 'Vale R$ 100', emoji: '⭐', probability: 15, color: 'from-blue-400 to-blue-600' },
  { id: 5, name: 'Desconto 50%', emoji: '🎅', probability: 12, color: 'from-red-500 to-pink-600' },
  { id: 6, name: 'Desconto 30%', emoji: '❄️', probability: 15, color: 'from-cyan-400 to-blue-500' },
  { id: 7, name: 'Desconto 20%', emoji: '🔔', probability: 15, color: 'from-purple-400 to-purple-600' },
  { id: 8, name: 'Brinde Especial', emoji: '🎊', probability: 10, color: 'from-orange-400 to-red-500' },
  { id: 9, name: 'Tente Novamente', emoji: '🎯', probability: 10, color: 'from-gray-400 to-gray-600' },
];

// Armazenamento em memória (persiste enquanto o servidor estiver rodando)
let currentPrizes: Prize[] = [...defaultPrizes];

// GET - Buscar prêmios atuais
export async function GET() {
  return NextResponse.json({ prizes: currentPrizes });
}

// POST - Atualizar prêmios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prizes } = body;

    if (!prizes || !Array.isArray(prizes)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um array de prêmios.' },
        { status: 400 }
      );
    }

    // Validar estrutura dos prêmios
    const isValid = prizes.every(
      (prize) =>
        typeof prize.id === 'number' &&
        typeof prize.name === 'string' &&
        typeof prize.emoji === 'string' &&
        typeof prize.probability === 'number' &&
        typeof prize.color === 'string'
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Estrutura de prêmios inválida.' },
        { status: 400 }
      );
    }

    // Atualizar prêmios
    currentPrizes = prizes;

    return NextResponse.json({ 
      success: true, 
      message: 'Prêmios atualizados com sucesso!',
      prizes: currentPrizes 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição.' },
      { status: 500 }
    );
  }
}
