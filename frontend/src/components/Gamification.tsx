// src/components/Gamification.tsx
import React, { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  streak: number;
  badges: string[];
}

export default function Gamification() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'challenges'>('achievements');

  useEffect(() => {
    // Load achievements and user stats
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        name: 'Primer Trade',
        description: 'Ejecuta tu primera orden',
        icon: '🎯',
        unlocked: true,
        unlockedAt: new Date('2024-01-15'),
        progress: 1,
        maxProgress: 1,
        rarity: 'common'
      },
      {
        id: '2',
        name: 'Streak Master',
        description: 'Mantén una racha de 10 trades ganadores',
        icon: '🔥',
        unlocked: false,
        progress: 7,
        maxProgress: 10,
        rarity: 'rare'
      },
      {
        id: '3',
        name: 'Profit King',
        description: 'Genera $10,000 en ganancias',
        icon: '👑',
        unlocked: false,
        progress: 6500,
        maxProgress: 10000,
        rarity: 'epic'
      },
      {
        id: '4',
        name: 'Risk Master',
        description: 'Mantén Sharpe ratio > 2.0 por 30 días',
        icon: '🛡️',
        unlocked: false,
        progress: 15,
        maxProgress: 30,
        rarity: 'legendary'
      },
      {
        id: '5',
        name: 'Volume Trader',
        description: 'Ejecuta 1000 trades',
        icon: '📊',
        unlocked: false,
        progress: 342,
        maxProgress: 1000,
        rarity: 'rare'
      },
      {
        id: '6',
        name: 'Perfect Week',
        description: 'Gana todos los trades de una semana',
        icon: '⭐',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'epic'
      }
    ];

    const mockUserStats: UserStats = {
      level: 15,
      xp: 2450,
      xpToNext: 500,
      totalTrades: 342,
      winRate: 68.5,
      totalProfit: 6500,
      streak: 7,
      badges: ['Primer Trade', 'Quick Learner', 'Risk Taker']
    };

    setAchievements(mockAchievements);
    setUserStats(mockUserStats);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-600';
      case 'rare': return 'border-blue-500 bg-blue-600';
      case 'epic': return 'border-purple-500 bg-purple-600';
      case 'legendary': return 'border-yellow-500 bg-yellow-600';
      default: return 'border-gray-500 bg-gray-600';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'shadow-blue-500/50';
      case 'epic': return 'shadow-purple-500/50';
      case 'legendary': return 'shadow-yellow-500/50';
      default: return '';
    }
  };

  const leaderboardData = [
    { rank: 1, name: 'CryptoMaster', level: 25, xp: 12500, profit: 45000 },
    { rank: 2, name: 'TradingPro', level: 23, xp: 11200, profit: 38000 },
    { rank: 3, name: 'BotBeast', level: 22, xp: 10800, profit: 35000 },
    { rank: 4, name: 'ProfitKing', level: 21, xp: 9800, profit: 32000 },
    { rank: 5, name: 'RiskMaster', level: 20, xp: 9200, profit: 28000 }
  ];

  const challenges = [
    {
      id: '1',
      title: 'Desafío Diario: Profit Target',
      description: 'Genera $500 en ganancias hoy',
      reward: '500 XP + Badge "Daily Winner"',
      progress: 320,
      maxProgress: 500,
      expires: '23:59',
      type: 'daily'
    },
    {
      id: '2',
      title: 'Desafío Semanal: Streak Master',
      description: 'Mantén 15 trades ganadores consecutivos',
      reward: '2000 XP + Badge "Streak Legend"',
      progress: 7,
      maxProgress: 15,
      expires: '7 días',
      type: 'weekly'
    },
    {
      id: '3',
      title: 'Desafío Mensual: Volume King',
      description: 'Ejecuta 500 trades este mes',
      reward: '5000 XP + Badge "Volume Master"',
      progress: 342,
      maxProgress: 500,
      expires: '15 días',
      type: 'monthly'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gamificación</h3>
        <div className="flex space-x-2">
          {(['achievements', 'leaderboard', 'challenges'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {tab === 'achievements' && 'Logros'}
              {tab === 'leaderboard' && 'Ranking'}
              {tab === 'challenges' && 'Desafíos'}
            </button>
          ))}
        </div>
      </div>

      {/* User Stats Header */}
      {userStats && (
        <div className="mb-6 p-4 bg-gray-700 rounded">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold">Nivel {userStats.level}</h4>
              <div className="w-64 bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {userStats.xp} / {userStats.xp + userStats.xpToNext} XP
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                ${userStats.totalProfit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Profit Total</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-400">{userStats.totalTrades}</div>
              <div className="text-xs text-gray-400">Trades</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-400">{userStats.winRate}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-400">{userStats.streak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-400">{userStats.badges.length}</div>
              <div className="text-xs text-gray-400">Badges</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Logros Desbloqueados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)} ${
                  achievement.unlocked ? getRarityGlow(achievement.rarity) : 'opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <h5 className="font-semibold">{achievement.name}</h5>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlocked ? (
                  <div className="text-xs text-green-400">
                    ✅ Desbloqueado {achievement.unlockedAt?.toLocaleDateString()}
                  </div>
                ) : (
                  <div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {achievement.progress} / {achievement.maxProgress}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Ranking Global</h4>
          <div className="space-y-2">
            {leaderboardData.map((player) => (
              <div key={player.rank} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    player.rank === 1 ? 'bg-yellow-500 text-black' :
                    player.rank === 2 ? 'bg-gray-400 text-black' :
                    player.rank === 3 ? 'bg-orange-500 text-black' :
                    'bg-gray-600 text-white'
                  }`}>
                    {player.rank}
                  </div>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-gray-400">Nivel {player.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-400">
                    ${player.profit.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{player.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Desafíos Activos</h4>
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="p-4 bg-gray-700 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-semibold">{challenge.title}</h5>
                    <p className="text-sm text-gray-400">{challenge.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    challenge.type === 'daily' ? 'bg-green-600' :
                    challenge.type === 'weekly' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {challenge.type.toUpperCase()}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{challenge.progress} / {challenge.maxProgress}</span>
                    <span>Expira: {challenge.expires}</span>
                  </div>
                </div>
                <div className="text-sm text-yellow-400">
                  Recompensa: {challenge.reward}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




