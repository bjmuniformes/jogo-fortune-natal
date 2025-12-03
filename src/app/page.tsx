'use client';

import { useState, useEffect } from 'react';
import { Gift, Sparkles, Settings, X, Save, Lock } from 'lucide-react';

// Tipos de prêmios
interface Prize {
  id: number;
  name: string;
  emoji: string;
  probability: number;
  color: string;
}

// Interface para flocos de neve
interface Snowflake {
  id: number;
  left: number;
  top: number;
  delay: number;
}

export default function FortuneTigerGame() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [slots, setSlots] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Senha de acesso ao painel admin
  const ADMIN_PASSWORD = 'bosk2024';

  // Carregar prêmios do servidor ao iniciar
  useEffect(() => {
    loadPrizes();
  }, []);

  // Gerar flocos de neve apenas no cliente
  useEffect(() => {
    const flakes: Snowflake[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setSnowflakes(flakes);
  }, []);

  // Atualizar slots quando prizes mudar
  useEffect(() => {
    if (prizes.length > 0 && slots.length === 0) {
      setSlots([prizes[0], prizes[1], prizes[2]]);
    }
  }, [prizes, slots.length]);

  // Carregar prêmios do servidor
  const loadPrizes = async () => {
    try {
      const response = await fetch('/api/prizes');
      const data = await response.json();
      setPrizes(data.prizes);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar prêmios:', error);
      setIsLoading(false);
    }
  };

  // Salvar prêmios no servidor
  const savePrizes = async (updatedPrizes: Prize[]) => {
    try {
      const response = await fetch('/api/prizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prizes: updatedPrizes }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrizes(data.prizes);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar prêmios:', error);
      return false;
    }
  };

  // Função para selecionar prêmio baseado em probabilidade
  const selectPrizeByProbability = (): Prize => {
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    const randomValue = Math.random() * totalProbability;
    
    console.log('🎰 ===== CÁLCULO DE PROBABILIDADE =====');
    console.log('📊 Total de probabilidade:', totalProbability);
    console.log('🎲 Valor aleatório gerado:', randomValue.toFixed(2));
    console.log('📋 Lista de prêmios e probabilidades:');
    
    prizes.forEach((prize, index) => {
      console.log(`  ${index + 1}. ${prize.emoji} ${prize.name} - ${prize.probability}% (${((prize.probability / totalProbability) * 100).toFixed(2)}% real)`);
    });
    
    let random = randomValue;
    let selectedPrize: Prize | null = null;
    
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      const rangeStart = randomValue - random;
      const rangeEnd = rangeStart + prize.probability;
      
      console.log(`\n🔍 Verificando: ${prize.emoji} ${prize.name}`);
      console.log(`   Range: ${rangeStart.toFixed(2)} - ${rangeEnd.toFixed(2)}`);
      console.log(`   Valor aleatório: ${randomValue.toFixed(2)}`);
      
      random -= prize.probability;
      
      if (random <= 0 && !selectedPrize) {
        selectedPrize = prize;
        console.log(`   ✅ PRÊMIO SELECIONADO!`);
      } else {
        console.log(`   ❌ Não selecionado`);
      }
    }
    
    const finalPrize = selectedPrize || prizes[prizes.length - 1];
    console.log(`\n🎁 RESULTADO FINAL: ${finalPrize.emoji} ${finalPrize.name}`);
    console.log('🎰 ===================================\n');
    
    return finalPrize;
  };

  // Função para girar os slots
  const spin = () => {
    if (isSpinning || prizes.length === 0) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Animação dos slots
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setSlots([
        prizes[Math.floor(Math.random() * prizes.length)],
        prizes[Math.floor(Math.random() * prizes.length)],
        prizes[Math.floor(Math.random() * prizes.length)],
      ]);
      
      spinCount++;
      if (spinCount > 20) {
        clearInterval(spinInterval);
        
        // Seleciona o prêmio final
        const finalPrize = selectPrizeByProbability();
        setSlots([finalPrize, finalPrize, finalPrize]);
        setResult(finalPrize);
        setIsSpinning(false);
        
        // Mostra resultado após animação
        setTimeout(() => {
          setShowResult(true);
        }, 500);
      }
    }, 100);
  };

  // Acesso secreto ao painel admin (5 cliques no canto)
  const handleAdminAccess = () => {
    setAdminClicks(prev => prev + 1);
    if (adminClicks >= 4) {
      setShowPasswordPrompt(true);
      setAdminClicks(0);
    }
  };

  // Verificar senha
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowPasswordPrompt(false);
      setShowAdmin(true);
      setPassword('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // Atualizar probabilidade
  const updateProbability = (id: number, newProb: number) => {
    const updatedPrizes = prizes.map(p => 
      p.id === id ? { ...p, probability: Math.max(0, Math.min(100, newProb)) } : p
    );
    setPrizes(updatedPrizes);
  };

  // Atualizar nome do prêmio
  const updatePrizeName = (id: number, newName: string) => {
    const updatedPrizes = prizes.map(p => 
      p.id === id ? { ...p, name: newName } : p
    );
    setPrizes(updatedPrizes);
  };

  // Atualizar emoji do prêmio
  const updatePrizeEmoji = (id: number, newEmoji: string) => {
    const updatedPrizes = prizes.map(p => 
      p.id === id ? { ...p, emoji: newEmoji } : p
    );
    setPrizes(updatedPrizes);
  };

  // Salvar e fechar painel admin
  const handleSaveAndClose = async () => {
    const success = await savePrizes(prizes);
    if (success) {
      setShowAdmin(false);
    } else {
      alert('Erro ao salvar configurações. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">
          🎄 Carregando... 🎄
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 relative overflow-hidden">
      {/* Flocos de neve animados */}
      <div className="absolute inset-0 pointer-events-none">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white text-2xl animate-pulse"
            style={{
              left: `${flake.left}%`,
              top: `${flake.top}%`,
              animationDelay: `${flake.delay}s`,
              opacity: 0.3,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      {/* Botão secreto admin (canto superior esquerdo) */}
      <div
        onClick={handleAdminAccess}
        className="absolute top-2 left-2 w-8 h-8 cursor-pointer z-50 opacity-0 hover:opacity-10"
        title="Acesso Admin"
      />

      {/* Header com logo */}
      <div className="relative z-10 pt-6 pb-4 px-4">
        <div className="flex justify-center items-center gap-4">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/e9fa4a3c-b43c-457b-9e24-68bd3bc99597.png" 
            alt="BOSK Logo" 
            className="h-16 w-auto drop-shadow-2xl"
          />
        </div>
        <h1 className="text-center text-4xl md:text-5xl font-bold text-white mt-4 drop-shadow-lg">
          🎄 Natal BOSK 🎄
        </h1>
        <p className="text-center text-xl text-yellow-300 mt-2 font-bold drop-shadow-md">
          Gire e Ganhe Prêmios!
        </p>
      </div>

      {/* Slot Machine */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8">
        {/* Container do slot */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-6 shadow-2xl border-8 border-yellow-600 max-w-md w-full">
          {/* Decoração superior */}
          <div className="flex justify-center gap-4 mb-4">
            <Sparkles className="text-red-600 w-8 h-8 animate-pulse" />
            <Gift className="text-green-600 w-10 h-10 animate-bounce" />
            <Sparkles className="text-red-600 w-8 h-8 animate-pulse" />
          </div>

          {/* Slots */}
          <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-2xl p-4 mb-6 shadow-inner">
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-lg transform transition-all duration-300 ${
                    isSpinning ? 'animate-bounce' : 'hover:scale-105'
                  }`}
                >
                  <div className="text-6xl mb-2">{slot.emoji}</div>
                  <div className="text-xs text-gray-700 font-bold text-center">
                    {slot.name.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Girar */}
          <button
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-6 rounded-2xl font-bold text-2xl shadow-2xl transform transition-all duration-300 ${
              isSpinning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95'
            } text-white border-4 border-green-700`}
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🎰</span>
                GIRANDO...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🎁 GIRAR 🎁
              </span>
            )}
          </button>

          {/* Decoração inferior */}
          <div className="flex justify-center gap-3 mt-4">
            {['🎅', '🎄', '⭐', '🎁', '🔔'].map((emoji, i) => (
              <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                {emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Resultado */}
        {showResult && result && (
          <div className="mt-8 bg-white rounded-3xl p-8 shadow-2xl border-4 border-yellow-400 max-w-md w-full animate-bounce">
            <div className="text-center">
              <div className="text-8xl mb-4">{result.emoji}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🎉 PARABÉNS! 🎉
              </h2>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
                {result.name}
              </p>
              <p className="text-gray-600 mt-4 text-sm">
                Mostre esta tela para retirar seu prêmio!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prompt de Senha */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-800">Acesso Restrito</h2>
              </div>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                  setPasswordError(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Digite a senha de administrador:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    passwordError 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2 font-semibold">
                    ❌ Senha incorreta! Tente novamente.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Painel Admin */}
      {showAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-800">Configuração de Prêmios</h2>
              </div>
              <button
                onClick={() => setShowAdmin(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {prizes.map((prize) => (
                <div key={prize.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Linha 1: Emoji e Nome */}
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={prize.emoji}
                        onChange={(e) => updatePrizeEmoji(prize.id, e.target.value)}
                        className="w-16 text-center text-3xl px-2 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => updatePrizeName(prize.id, e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Nome do prêmio"
                      />
                    </div>
                    
                    {/* Linha 2: Probabilidade */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        Probabilidade:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={prize.probability}
                        onChange={(e) => updateProbability(prize.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center font-bold"
                      />
                      <span className="text-sm text-gray-600">%</span>
                      
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden ml-2">
                        <div
                          className={`h-full bg-gradient-to-r ${prize.color} transition-all duration-300`}
                          style={{ width: `${Math.min(prize.probability, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Total de Probabilidade:</strong>{' '}
                <span className="font-bold text-blue-600">
                  {prizes.reduce((sum, p) => sum + p.probability, 0)}%
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-2">
                💡 Dica: A soma não precisa ser 100%. O sistema calcula proporcionalmente.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSaveAndClose}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 text-center pb-8 px-4">
        <p className="text-white text-sm opacity-80">
          🎄 Feliz Natal! Promoção válida enquanto durarem os estoques 🎄
        </p>
      </div>
    </div>
  );
}
