// pages/api/players/history.js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { steamId, months = 3 } = req.query;
    
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return res.status(400).json({ error: 'Invalid Steam ID format' });
    }
    
    const url = `${getApiUrl('/api/public/players/history')}?steamId=${steamId}&months=${months}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch player history (Status: ${response.status})`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching player history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch player history',
      message: error.message 
    });
  }
}