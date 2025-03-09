// pages/api/servers/[id].js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

// Dados padrão para campos que podem estar ausentes na API
const defaultServerDetails = {
  description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo. Regras balanceadas, economia sustentável e comunidade ativa te esperam.",
  logo: "/images/rust_banner2.png",
  bannerImage: "/images/rust_banner.png",
  wipeSchedule: "Primeira quinta-feira do mês",
  features: ["Casual", "Survival", "2x", "Events"],
  modded: false,
  rules: [
    "Não é permitido usar cheats ou exploits",
    "Respeite outros jogadores no chat",
    "Construções tóxicas serão removidas",
    "Times limitados a 5 membros"
  ],
  discordUrl: "https://discord.gg/v8575VMgPW",
  connectCommand: "client.connect 82.29.62.21:28015",
  adminContacts: ["Discord: thezanardine"]
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }
  
  try {
    // ETAPA 1: Buscar detalhes do servidor
    console.log(`Fetching server details for ID: ${id}`);
    
    const serverUrl = `${getApiUrl('/api/public/serverstats')}/${id}`;
    const serverResponse = await fetch(serverUrl, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    let serverData = {};
    let useFallback = false;
    
    if (!serverResponse.ok) {
      console.warn(`Failed to fetch server details (Status: ${serverResponse.status}), using fallback data`);
      useFallback = true;
    } else {
      try {
        const responseData = await serverResponse.json();
        if (responseData.success && responseData.server) {
          serverData = responseData.server;
        } else {
          console.warn('Unexpected server response format:', responseData);
          useFallback = true;
        }
      } catch (parseError) {
        console.error('Error parsing server response:', parseError);
        useFallback = true;
      }
    }
    
    // Construir objeto de servidor combinando dados da API com defaults
    const server = {
      id: id,
      name: serverData.server_name || "Rust Survival",
      game: serverData.protocol || "rust",
      status: serverData.status || "online",
      players: serverData.online_players || 0,
      maxPlayers: serverData.max_players || 60,
      address: serverData.address || "82.29.62.21:28015",
      map: serverData.map || "Unknown",
      seed: serverData.seed || "328564061",
      worldSize: serverData.size || "4000",
      lastWipe: serverData.last_wipe || null,
      description: serverData.description || defaultServerDetails.description,
      logo: serverData.logo || defaultServerDetails.logo,
      bannerImage: serverData.banner_image || defaultServerDetails.bannerImage,
      wipeSchedule: serverData.wipe_schedule || defaultServerDetails.wipeSchedule,
      features: serverData.features || defaultServerDetails.features,
      modded: serverData.modded || defaultServerDetails.modded,
      rules: serverData.rules || defaultServerDetails.rules,
      discordUrl: serverData.discord_url || defaultServerDetails.discordUrl,
      connectCommand: serverData.connect_command || `client.connect ${serverData.address || "82.29.62.21:28015"}`,
      adminContacts: serverData.admin_contacts || defaultServerDetails.adminContacts,
      nextWipe: serverData.next_wipe || null
    };
    
    // ETAPA 2: Buscar Dados de Leaderboard
    console.log(`Fetching leaderboard for server ID: ${id}`);
    
    let leaderboard = [];
    
    try {
      const leaderboardUrl = `${getApiUrl('/api/public/players')}?limit=15&serverId=${id}`;
      const leaderboardResponse = await fetch(leaderboardUrl, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        
        if (leaderboardData.success && leaderboardData.players) {
          leaderboard = leaderboardData.players.map(player => ({
            playerId: player.steam_id,
            playerName: player.name,
            kills: player.kills || 0,
            deaths: player.deaths || 0,
            playtime: player.time_played || 0,
            lastSeen: player.last_seen || new Date().toISOString()
          }));
        } else {
          console.warn('Unexpected leaderboard response format:', leaderboardData);
          // Usar leaderboard vazio
        }
      } else {
        console.warn(`Failed to fetch leaderboard (Status: ${leaderboardResponse.status})`);
        // Usar leaderboard vazio
      }
    } catch (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError);
      // Continuar com leaderboard vazio
    }
    
    // ETAPA 3: Buscar Eventos Recentes
    console.log(`Fetching events for server ID: ${id}`);
    
    let events = [];
    
    try {
      const eventsUrl = `${getApiUrl('/api/public/events')}?limit=5&serverId=${id}`;
      const eventsResponse = await fetch(eventsUrl, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        
        if (eventsData.success && eventsData.events) {
          events = eventsData.events.map(event => {
            // Converter nomes de eventos para formatos amigáveis
            let title = event.event_type || '';
            title = title.replace('event.', '').replace('player.', '');
            title = title.split('.').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            return {
              id: event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              description: event.payload?.message || "Evento de servidor",
              date: event.timestamp || new Date().toISOString(),
              image: "/images/events/wipe.jpg"
            };
          });
        } else {
          console.warn('Unexpected events response format:', eventsData);
          // Usar array de eventos vazio
        }
      } else {
        console.warn(`Failed to fetch events (Status: ${eventsResponse.status})`);
        // Usar array de eventos vazio
      }
    } catch (eventsError) {
      console.error('Error fetching events:', eventsError);
      // Continuar com array de eventos vazio
    }
    
    // Se não houver eventos, adicionar um evento padrão de wipe
    if (events.length === 0) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // Primeiro dia do próximo mês
      
      events.push({
        id: "default-wipe-event",
        title: "Wipe Semanal",
        description: "Reset completo do servidor, incluindo itens, construções e blueprints.",
        date: nextMonth.toISOString(),
        image: "/images/events/wipe.jpg"
      });
    }
    
    // ETAPA 4: Retornar todos os dados consolidados
    return res.status(200).json({
      server,
      leaderboard,
      events
    });
    
  } catch (error) {
    console.error('Error fetching server details:', error);
    
    // Em caso de erro, retornar dados padrão para não quebrar a UI
    const fallbackServer = {
      id: id,
      name: "Rust Survival",
      game: "rust",
      status: "online",
      players: 0,
      maxPlayers: 60,
      address: "82.29.62.21:28015",
      map: "Unknown",
      seed: "328564061",
      worldSize: "4000",
      description: defaultServerDetails.description,
      logo: defaultServerDetails.logo,
      bannerImage: defaultServerDetails.bannerImage,
      wipeSchedule: defaultServerDetails.wipeSchedule,
      features: defaultServerDetails.features,
      modded: defaultServerDetails.modded,
      rules: defaultServerDetails.rules,
      discordUrl: defaultServerDetails.discordUrl,
      connectCommand: defaultServerDetails.connectCommand,
      adminContacts: defaultServerDetails.adminContacts
    };
    
    // Mock leaderboard vazio
    const fallbackLeaderboard = [];
    
    // Evento wipe padrão para manter a consistência da UI
    const fallbackEvents = [
      { 
        id: "default-wipe-event",
        title: "Wipe Semanal", 
        description: "Reset completo do servidor, incluindo itens, construções e blueprints.", 
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        image: "/images/events/wipe.jpg"
      }
    ];
    
    // Retornar dados padrão
    return res.status(200).json({
      server: fallbackServer,
      leaderboard: fallbackLeaderboard,
      events: fallbackEvents
    });
  }
}