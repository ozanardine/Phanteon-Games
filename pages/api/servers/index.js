// pages/api/servers/index.js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

// Dados base para complementar informações que podem não estar disponíveis na API
const defaultServerData = {
  description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo.",
  logo: "/images/rust_banner2.png",
  wipeSchedule: "Primeira quinta-feira do mês",
  features: ["Casual", "Survival", "2x"],
  modded: false
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { game } = req.query;
  
  try {
    // Buscar no servidor Node.js
    let url = getApiUrl('/api/public/serverstats');
    if (game) url += `?game=${game}`;
    
    console.log(`Fetching server stats from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch server data (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.stats) {
      console.warn('Unexpected response format from Node.js server:', data);
      throw new Error('Invalid data format received from server');
    }
    
    // Mapear para o formato esperado pelo frontend
    const mappedServers = data.stats.map(server => ({
      id: server.server_id || "32225312",
      name: server.server_name || "Rust Survival #1",
      game: server.protocol === 'rust' ? 'rust' : 'rust', // Fallback para rust
      status: server.status || 'unknown',
      players: server.online_players || 0,
      maxPlayers: server.max_players || 60,
      address: server.address || `${server.ip || '127.0.0.1'}:${server.port || '28015'}`,
      map: server.map || 'Unknown',
      seed: server.seed || defaultServerData.seed || "328564061",
      worldSize: server.size || defaultServerData.worldSize || "4000",
      lastWipe: server.last_wipe || null,
      description: server.description || defaultServerData.description,
      logo: server.logo || defaultServerData.logo,
      wipeSchedule: server.wipe_schedule || defaultServerData.wipeSchedule,
      features: server.features || defaultServerData.features,
      modded: server.modded || defaultServerData.modded,
      // Campos adicionais que podem ser úteis
      queued: server.queued_players || 0,
      fps: server.fps || 60
    }));
    
    // Se não tiver servidores ou ocorrer erro, usar o servidor padrão
    if (mappedServers.length === 0) {
      console.log('No servers found from API, using default server data');
      mappedServers.push({
        id: "32225312",
        name: "Rust Survival #1",
        game: "rust",
        status: "online",
        players: 0,
        maxPlayers: 60,
        address: "82.29.62.21:28015",
        map: "Unknown",
        seed: "328564061",
        worldSize: "4000",
        description: defaultServerData.description,
        logo: defaultServerData.logo,
        wipeSchedule: defaultServerData.wipeSchedule,
        features: defaultServerData.features,
        modded: defaultServerData.modded
      });
    }
    
    return res.status(200).json(mappedServers);
  } catch (error) {
    console.error('Error processing server data:', error);
    
    // Em caso de falha, retornar servidor padrão para não quebrar a UI
    const fallbackServers = [{
      id: "32225312",
      name: "Rust Survival #1",
      game: "rust",
      status: "online",
      players: 0,
      maxPlayers: 60,
      address: "82.29.62.21:28015",
      map: "Unknown",
      seed: "328564061",
      worldSize: "4000",
      description: defaultServerData.description,
      logo: defaultServerData.logo,
      wipeSchedule: defaultServerData.wipeSchedule,
      features: defaultServerData.features,
      modded: defaultServerData.modded
    }];
    
    // Log do erro mas retorna dados default para não quebrar a UI
    console.log('Returning fallback server data due to error');
    return res.status(200).json(fallbackServers);
  }
}