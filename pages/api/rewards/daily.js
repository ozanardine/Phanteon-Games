// pages/api/rewards/daily.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { getUserByDiscordId } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();

    // Buscar o usuário pelo Discord ID
    const userData = await getUserByDiscordId(discordIdString);
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar se o usuário tem um Steam ID configurado
    if (!userData.steam_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID não configurado. Configure seu Steam ID para acessar recompensas diárias.' 
      });
    }

    // Buscar status diário do jogador
    const { data: dailyStatus, error: statusError } = await supabaseAdmin
      .from('player_daily_status')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      throw statusError;
    }

    // Buscar histórico de recompensas recentes
    const { data: rewardHistory, error: historyError } = await supabaseAdmin
      .from('daily_rewards')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .order('claimed_at', { ascending: false })
      .limit(10);

    if (historyError) throw historyError;

    // Se não há status diário, criar um novo
    if (!dailyStatus) {
      // Valor padrão para novo status diário
      const defaultStatus = {
        user_id: userData.id,
        steam_id: userData.steam_id,
        consecutive_days: 0,
        claimed_days: [],
        last_claim_date: null,
        vip_status: determineVipStatus(userData),
        has_missed_day: false,
        is_active: true,
        cycle_start_date: new Date().toISOString(),
        next_reset_time: getNextResetTime(),
        has_active_rewards: true
      };

      // Retornar com recompensas disponíveis
      return res.status(200).json({
        success: true,
        status: defaultStatus,
        rewards: generateDailyRewards(defaultStatus),
        history: rewardHistory || []
      });
    }

    // Verificar se o status está atualizado
    const updatedStatus = checkAndUpdateDailyStatus(dailyStatus);
    
    // Retornar os dados
    return res.status(200).json({
      success: true,
      status: updatedStatus,
      rewards: generateDailyRewards(updatedStatus),
      history: rewardHistory || []
    });
  } catch (error) {
    console.error('[API:daily-rewards] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar recompensas diárias',
      details: error.message 
    });
  }
}

// Função para determinar o status VIP
function determineVipStatus(userData) {
  // Lógica para determinar o status VIP do usuário
  // Isso poderia verificar a tabela de assinaturas
  return userData.vip_status || 'none';
}

// Função para obter o próximo horário de reset (meia-noite UTC)
function getNextResetTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Função para verificar e atualizar o status diário
function checkAndUpdateDailyStatus(status) {
  const now = new Date();
  const nextReset = new Date(status.next_reset_time);
  
  // Se já passou do horário de reset
  if (now > nextReset) {
    // Verifica se o jogador perdeu um dia
    const lastClaimDate = status.last_claim_date ? new Date(status.last_claim_date) : null;
    const hasMissedDay = lastClaimDate 
      ? (nextReset - lastClaimDate) > (24 * 60 * 60 * 1000 * 2) // Mais de 2 dias
      : false;
    
    return {
      ...status,
      has_missed_day: hasMissedDay,
      consecutive_days: hasMissedDay ? 0 : status.consecutive_days,
      next_reset_time: getNextResetTime()
    };
  }
  
  return status;
}

// Função para gerar recompensas diárias baseadas no status do jogador
function generateDailyRewards(status) {
  // Estrutura básica de recompensas
  const basicRewards = [
    { day: 1, items: [{ name: "Scrap", amount: 20, isVip: false }] },
    { day: 2, items: [{ name: "Wood", amount: 1000, isVip: false }] },
    { day: 3, items: [{ name: "Stone", amount: 500, isVip: false }] },
    { day: 4, items: [{ name: "Metal Fragments", amount: 250, isVip: false }] },
    { day: 5, items: [{ name: "Low Grade Fuel", amount: 100, isVip: false }] },
    { day: 6, items: [{ name: "Scrap", amount: 50, isVip: false }] },
    { day: 7, items: [{ name: "Scrap", amount: 100, isVip: false }] }
  ];
  
  // Bônus VIP
  const vipBonuses = {
    'vip-basic': [
      { name: "Scrap", amount: 20, isVip: true },
      { name: "Small Stash", amount: 1, isVip: true }
    ],
    'vip-plus': [
      { name: "Scrap", amount: 50, isVip: true },
      { name: "Small Stash", amount: 1, isVip: true },
      { name: "Supply Signal", amount: 1, isVip: true }
    ],
    'vip-premium': [
      { name: "Scrap", amount: 100, isVip: true },
      { name: "Small Stash", amount: 2, isVip: true },
      { name: "Supply Signal", amount: 2, isVip: true },
      { name: "Timed Explosive", amount: 1, isVip: true }
    ]
  };
  
  // Adicionar bônus VIP às recompensas
  const rewards = basicRewards.map(reward => {
    let rewardCopy = { ...reward };
    
    // Se o jogador tem VIP, adicionar bônus VIP
    if (status.vip_status !== 'none' && vipBonuses[status.vip_status]) {
      // Dia 7 tem bônus especial para VIP
      if (reward.day === 7) {
        rewardCopy.items = [...rewardCopy.items, ...vipBonuses[status.vip_status]];
      } else {
        // Outros dias têm bônus menores
        rewardCopy.items = [...rewardCopy.items, { name: "Scrap", amount: 10 * reward.day, isVip: true }];
      }
    }
    
    // Marcar como já reivindicado
    rewardCopy.claimed = (status.claimed_days || []).includes(reward.day);
    
    // Marcar como disponível para reivindicar
    const nextDay = status.consecutive_days + 1;
    rewardCopy.available = reward.day === nextDay && !rewardCopy.claimed;
    
    return rewardCopy;
  });
  
  return rewards;
}