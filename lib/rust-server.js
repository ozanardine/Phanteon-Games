/**
 * Funções para interagir com o servidor Rust via API
 */

// Configuração
const RUST_API_KEY = process.env.RUST_API_KEY;
const RUST_API_URL = process.env.RUST_API_URL;
const RUST_SERVER_IP = process.env.RUST_SERVER_IP;

/**
 * Adiciona permissões VIP para um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @param {number} days - Número de dias para a assinatura
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function addVipPermissions(steamId, days = 30) {
  if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
    console.error('[RustServer] SteamID inválido:', steamId);
    return false;
  }

  try {
    console.log(`[RustServer] Adicionando VIP para SteamID: ${steamId}, ${days} dias`);
    
    // Validar configuração
    if (!RUST_API_URL || !RUST_API_KEY || !RUST_SERVER_IP) {
      console.error('[RustServer] Configuração da API do servidor Rust incompleta:');
      console.error(`  RUST_API_URL = ${RUST_API_URL || 'não definido'}`);
      console.error(`  RUST_API_KEY = ${RUST_API_KEY ? '***definido***' : 'não definido'}`);
      console.error(`  RUST_SERVER_IP = ${RUST_SERVER_IP || 'não definido'}`);
      return false;
    }

    // Montar a URL com segurança
    const baseUrl = RUST_API_URL.trim().replace(/\/+$/, '');
    const url = `${baseUrl}/addvip`;
    console.log(`[RustServer] Fazendo requisição para: ${url}`);

    // Método API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUST_API_KEY}`
      },
      body: JSON.stringify({ 
        steamId, 
        days,
        server: RUST_SERVER_IP
      })
    });

    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {}
      
      console.error(`[RustServer] Erro ao adicionar permissões VIP: ${errorMessage}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[RustServer] Permissões VIP adicionadas com sucesso para: ${steamId}`);
    } else {
      console.error(`[RustServer] Falha ao adicionar permissões VIP: ${result.message || 'Erro desconhecido'}`);
    }
    
    return result.success;
  } catch (error) {
    console.error('[RustServer] Exceção ao adicionar permissões VIP:', error);
    return false;
  }
}

/**
 * Remove permissões VIP de um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function removeVipPermissions(steamId) {
  if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
    console.error('[RustServer] SteamID inválido:', steamId);
    return false;
  }

  try {
    console.log(`[RustServer] Removendo VIP para SteamID: ${steamId}`);
    
    // Validar configuração
    if (!RUST_API_URL || !RUST_API_KEY || !RUST_SERVER_IP) {
      console.error('[RustServer] Configuração da API do servidor Rust incompleta');
      return false;
    }

    // Montar a URL com segurança
    const baseUrl = RUST_API_URL.trim().replace(/\/+$/, '');
    const url = `${baseUrl}/removevip`;
    console.log(`[RustServer] Fazendo requisição para: ${url}`);

    // Método API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUST_API_KEY}`
      },
      body: JSON.stringify({ 
        steamId,
        server: RUST_SERVER_IP
      })
    });

    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {}
      
      console.error(`[RustServer] Erro ao remover permissões VIP: ${errorMessage}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[RustServer] Permissões VIP removidas com sucesso para: ${steamId}`);
    } else {
      console.error(`[RustServer] Falha ao remover permissões VIP: ${result.message || 'Erro desconhecido'}`);
    }
    
    return result.success;
  } catch (error) {
    console.error('[RustServer] Exceção ao remover permissões VIP:', error);
    return false;
  }
}

/**
 * Verifica o status VIP de um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @returns {Promise<Object>} - Status VIP do jogador
 */
export async function checkVipStatus(steamId) {
  if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
    console.error('[RustServer] SteamID inválido:', steamId);
    return null;
  }

  try {
    console.log(`[RustServer] Verificando status VIP para SteamID: ${steamId}`);
    
    // Validar configuração
    if (!RUST_API_URL || !RUST_API_KEY || !RUST_SERVER_IP) {
      console.error('[RustServer] Configuração da API do servidor Rust incompleta');
      return null;
    }

    // Montar a URL com segurança
    const baseUrl = RUST_API_URL.trim().replace(/\/+$/, '');
    const url = `${baseUrl}/vipstatus?steamId=${steamId}&server=${RUST_SERVER_IP}`;
    console.log(`[RustServer] Fazendo requisição para: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUST_API_KEY}`
      }
    });

    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {}
      
      console.error(`[RustServer] Erro ao verificar status VIP: ${errorMessage}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`[RustServer] Status VIP obtido com sucesso para: ${steamId}`);
    return result;
  } catch (error) {
    console.error('[RustServer] Exceção ao verificar status VIP:', error);
    return null;
  }
}