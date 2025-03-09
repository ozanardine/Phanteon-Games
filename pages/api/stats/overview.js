// pages/api/stats/overview.js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = getApiUrl('/api/public/stats/overview');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch system overview (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Formatar os dados para o frontend
    const formattedData = {
      totalPlayers: data.totalPlayers || 0,
      activePlayers: data.activePlayers || 0,
      totalServers: data.totalServers || 1,
      activeSubscriptions: data.activeSubscriptions || 0,
      totalEvents: data.totalEvents || 0,
      lastUpdate: data.lastUpdate || new Date().toISOString()
    };
    
    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching system overview:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch system overview',
      message: error.message 
    });
  }
}