// pages/api/leaderboard/monthly.js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, year, limit = 20, serverId } = req.query;
    
    let url = `${getApiUrl('/api/public/leaderboard/monthly')}?limit=${limit}`;
    if (month) url += `&month=${month}`;
    if (year) url += `&year=${year}`;
    if (serverId) url += `&serverId=${serverId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch monthly leaderboard (Status: ${response.status})`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monthly leaderboard',
      message: error.message 
    });
  }
}