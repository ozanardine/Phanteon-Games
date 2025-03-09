import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiUsers, FiServer, FiMap, FiCalendar, FiHash, FiMaximize2, 
  FiChevronLeft, FiClock, FiRefreshCw, FiInfo, FiChevronRight,
  FiAlertTriangle, FiList, FiLink, FiClipboard, FiCheck, FiShield
} from 'react-icons/fi';
import { SiRust } from 'react-icons/si';
import { TabSelector } from '../../components/ui/TabSelector';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RustMapPreview from '../../components/servers/RustMapPreview';
import Leaderboard from '../../components/servers/Leaderboard';
import { toast } from 'react-hot-toast';
import { useSocket, useSocketEvent } from '../../lib/socket-client';

export default function ServerDetailPage() {
  const router = useRouter();
  const { id, tab: initialTab } = router.query;
  
  const [activeTab, setActiveTab] = useState(initialTab || 'info');
  const [serverData, setServerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Socket.io para atualizações em tempo real
  const { socket, isConnected } = useSocket();

  const tabs = [
    { id: 'info', label: 'Informações', icon: <FiInfo /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <FiUsers /> },
    { id: 'events', label: 'Eventos', icon: <FiCalendar /> },
    { id: 'rules', label: 'Regras', icon: <FiList /> },
  ];

  useEffect(() => {
    // Set initial tab based on URL or default to 'info'
    if (initialTab && tabs.some(t => t.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Configurar evento socket.io para atualizações em tempo real
  useSocketEvent('server_update', (data) => {
    if (data && data.server_id === id) {
      // Atualizar apenas os dados do servidor, preservando o resto do estado
      setServerData(prevData => {
        if (!prevData) return null;
        
        // Atualizar apenas as propriedades relevantes do servidor
        return {
          ...prevData,
          server: {
            ...prevData.server,
            players: data.online_players || prevData.server.players,
            maxPlayers: data.max_players || prevData.server.maxPlayers,
            status: data.status || prevData.server.status
          }
        };
      });
    }
  });

  // Também escutar por eventos do servidor
  useSocketEvent('server_event', (eventData) => {
    if (eventData && eventData.server_id === id) {
      setServerData(prevData => {
        if (!prevData) return null;
        
        // Formatar o novo evento
        const newEvent = {
          id: eventData.id || `event-${Date.now()}`,
          title: eventData.event_type
            ? eventData.event_type.replace('event.', '').replace('player.', '').split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : 'Novo Evento',
          description: eventData.payload?.message || "Evento de servidor",
          date: eventData.timestamp || new Date().toISOString(),
          image: "/images/events/wipe.jpg"
        };

        // Adicionar o novo evento ao início da lista
        return {
          ...prevData,
          events: [newEvent, ...prevData.events.slice(0, 9)] // Manter apenas os 10 mais recentes
        };
      });
    }
  });

  const fetchServerDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      // Add timestamp to prevent caching
      const response = await fetch(`/api/servers/${id}?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch server details (Status: ${response.status})`);
      }
      
      const data = await response.json();
      
      // Preserve description from previous data if missing in the new data
      if (data.server && !data.server.description && serverData?.server?.description) {
        data.server.description = serverData.server.description;
      }
      
      setServerData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching server details:', err);
      setError(err.message || 'Failed to fetch server details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerDetails();
    
    // Auto refresh every 2 minutes
    const interval = setInterval(fetchServerDetails, 120000);
    
    return () => clearInterval(interval);
  }, [id]);

  // Update URL when tab changes without full reload
  useEffect(() => {
    if (activeTab && id) {
      router.push(`/servers/${id}?tab=${activeTab}`, undefined, { shallow: true });
    }
  }, [activeTab, id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServerDetails();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      console.error("Date formatting error:", e);
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      console.error("DateTime formatting error:", e);
      return 'Data/hora inválida';
    }
  };

  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes % 60}m`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        toast.success('Comando copiado para a área de transferência!');
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (err) => {
        console.error('Erro ao copiar texto: ', err);
        toast.error('Erro ao copiar texto.');
      }
    );
  };

  const getPlayerPercentage = (players, maxPlayers) => {
    return Math.min(Math.round((players / maxPlayers) * 100), 100);
  };

  const getPlayerBarColor = (players, maxPlayers) => {
    const percentage = getPlayerPercentage(players, maxPlayers);
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Status de conexão do Socket.io
  const renderSocketStatus = () => {
    if (!socket) return null;
    
    return (
      <div className="ml-2 inline-flex items-center">
        <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        <span className="text-xs text-gray-400">{isConnected ? 'Tempo real' : 'Offline'}</span>
      </div>
    );
  };

  // Display loading state
  if (isLoading && !refreshing) {
    return (
      <div className="min-h-screen bg-dark-400">
        <div className="container-custom mx-auto py-12 px-4">
          <div className="flex items-center text-gray-400 mb-6">
            <Link href="/servers" className="flex items-center hover:text-primary transition-colors">
              <FiChevronLeft className="mr-1" />
              Voltar para Servidores
            </Link>
          </div>
          
          <div className="flex justify-center items-center py-32">
            <LoadingSpinner size="lg" color="primary" fullScreen={false} text="Carregando informações do servidor..." />
          </div>
        </div>
      </div>
    );
  }

  // Display error state
  if (error || !serverData) {
    return (
      <div className="min-h-screen bg-dark-400">
        <div className="container-custom mx-auto py-12 px-4">
          <div className="flex items-center text-gray-400 mb-6">
            <Link href="/servers" className="flex items-center hover:text-primary transition-colors">
              <FiChevronLeft className="mr-1" />
              Voltar para Servidores
            </Link>
          </div>

          <Card variant="darker" padding="large" className="border-red-500/20">
            <div className="text-center">
              <FiAlertTriangle className="mx-auto text-4xl text-red-500 mb-4" />
              <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar servidor</h3>
              <p className="text-gray-300 mb-4">
                {error || 'Não foi possível carregar os detalhes do servidor.'}
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <Button 
                  onClick={handleRefresh}
                  variant="danger"
                  icon={<FiRefreshCw />}
                >
                  Tentar Novamente
                </Button>
                <Button 
                  href="/servers"
                  variant="secondary"
                >
                  Voltar para Servidores
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const { server, leaderboard = [], events = [] } = serverData;

  return (
    <>
      <Head>
        <title>{server.name} | Phanteon Games</title>
        <meta name="description" content={`Detalhes e estatísticas do servidor ${server.name} da comunidade Phanteon Games.`} />
      </Head>

      <main className="min-h-screen bg-dark-400">
        {/* Hero Banner Section */}
        <section className="relative h-[300px] md:h-[400px] bg-dark-300 overflow-hidden">
          {server.bannerImage ? (
            <div className="absolute inset-0">
              <Image 
                src={server.bannerImage}
                alt={server.name}
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/70 to-dark-400/30"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-dark-400 to-dark-300"></div>
          )}
          
          {/* Content overlay */}
          <div className="container-custom mx-auto px-4 h-full relative z-10 flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <Link href="/servers" className="text-gray-300 hover:text-primary transition-colors flex items-center">
                    <FiChevronLeft className="mr-1" />
                    Servidores
                  </Link>
                  <span className="mx-2 text-gray-500">/</span>
                  <span className="text-gray-400">{server.name}</span>
                </div>
                
                <div className="flex items-center">
                  {server.logo && (
                    <div className="w-16 h-16 mr-4 rounded-md bg-dark-400 overflow-hidden border border-dark-200 shadow-lg">
                      <Image 
                        src={server.logo}
                        alt={`${server.name} logo`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{server.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Card.Badge 
                        variant={server.status === 'online' ? 'success' : 'danger'}
                      >
                        {server.status === 'online' ? 'Online' : 'Offline'}
                      </Card.Badge>
                      <Card.Badge variant="info" className="capitalize flex items-center">
                        {server.game === 'rust' ? (
                          <>
                            <SiRust className="mr-1" /> Rust
                          </>
                        ) : server.game}
                      </Card.Badge>
                      <span className="text-gray-300 flex items-center">
                        <FiUsers className="mr-1 text-primary" />
                        {server.players}/{server.maxPlayers}
                      </span>
                      {server.modded && (
                        <Card.Badge variant="warning">Modded</Card.Badge>
                      )}
                      {renderSocketStatus()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  icon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
                >
                  {refreshing ? "Atualizando..." : "Atualizar"}
                </Button>
                
                {server.discordUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    href={server.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </Button>
                )}
                
                {server.connectCommand && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => copyToClipboard(server.connectCommand)}
                    className="group"
                  >
                    {copySuccess ? (
                      <>
                        <FiCheck className="mr-2" /> Copiado
                      </>
                    ) : (
                      <>
                        Jogar Agora
                        <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Players Bar Section */}
        <section className="bg-dark-300 py-4 border-t border-b border-dark-200">
          <div className="container-custom mx-auto px-4">
            <Card variant="darker" className="p-4 bg-gradient-to-r from-dark-400 to-dark-300">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center text-gray-300">
                  <FiUsers className="mr-2 text-primary" />
                  <span>Jogadores Online</span>
                </div>
                <span className="text-white font-medium">
                  {server.players}/{server.maxPlayers}
                </span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getPlayerBarColor(server.players, server.maxPlayers)} transition-all duration-500`} 
                  style={{ width: `${getPlayerPercentage(server.players, server.maxPlayers)}%` }}
                ></div>
              </div>
            </Card>
          </div>
        </section>

        {/* Tabs and Content Section */}
        <section className="py-10 bg-dark-400">
          <div className="container-custom mx-auto px-4">
            {/* Tabs */}
            <div className="mb-6">
              <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {/* Tab Panels */}
            <div className="bg-dark-300 rounded-lg shadow-lg overflow-hidden">
              {/* Info Tab Panel */}
              {activeTab === 'info' && (
                <div className="p-6">
                  {/* Description */}
                  {server.description && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FiInfo className="text-primary mr-3" />
                        Sobre o Servidor
                      </h3>
                      <div className="bg-dark-400/50 p-5 rounded-lg border border-dark-200">
                        <p className="text-gray-300 leading-relaxed">{server.description}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Server Info Grid */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <FiServer className="text-primary mr-3" />
                      Informações do Servidor
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                        <div className="flex items-center text-gray-300 mb-2">
                          <FiUsers className="mr-2 text-primary" />
                          <span>Jogadores</span>
                        </div>
                        <p className="text-white font-medium text-lg">
                          {server.players} / {server.maxPlayers}
                        </p>
                      </div>
                      
                      <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                        <div className="flex items-center text-gray-300 mb-2">
                          <FiMap className="mr-2 text-primary" />
                          <span>Mapa</span>
                        </div>
                        <p className="text-white font-medium text-lg">
                          {server.map || 'N/A'}
                        </p>
                      </div>
                      
                      {server.lastWipe && (
                        <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                          <div className="flex items-center text-gray-300 mb-2">
                            <FiCalendar className="mr-2 text-primary" />
                            <span>Último Wipe</span>
                          </div>
                          <p className="text-white font-medium text-lg">
                            {formatDate(server.lastWipe)}
                          </p>
                        </div>
                      )}
                      
                      {server.seed && (
                        <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                          <div className="flex items-center text-gray-300 mb-2">
                            <FiHash className="mr-2 text-primary" />
                            <span>Seed</span>
                          </div>
                          <p className="text-white font-medium text-lg">
                            {server.game === 'rust' ? (
                              <a 
                                href={`https://rustmaps.com/map/${server.worldSize}/${server.seed}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {server.seed}
                              </a>
                            ) : server.seed}
                          </p>
                        </div>
                      )}
                      
                      {server.worldSize && (
                        <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                          <div className="flex items-center text-gray-300 mb-2">
                            <FiMaximize2 className="mr-2 text-primary" />
                            <span>Tamanho</span>
                          </div>
                          <p className="text-white font-medium text-lg">
                            {server.worldSize}
                          </p>
                        </div>
                      )}
                      
                      {server.wipeSchedule && (
                        <div className="bg-dark-400/50 rounded-lg p-4 border border-dark-200">
                          <div className="flex items-center text-gray-300 mb-2">
                            <FiClock className="mr-2 text-primary" />
                            <span>Ciclo de Wipe</span>
                          </div>
                          <p className="text-white font-medium text-lg">
                            {server.wipeSchedule}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Server Features */}
                  {server.features && server.features.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FiShield className="text-primary mr-3" />
                        Características do Servidor
                      </h3>
                      
                      <div className="flex flex-wrap gap-3">
                        {server.features.map((feature, index) => (
                          <span 
                            key={index} 
                            className="bg-dark-400 border border-dark-200 text-gray-300 rounded-full px-4 py-1 text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mods List */}
                  {server.mods && server.mods.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FiLink className="text-primary mr-3" />
                        Plugins & Mods
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {server.mods.map((mod, index) => (
                          <div 
                            key={index} 
                            className="bg-dark-400 border border-dark-200 text-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            {mod}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview do Mapa para servidores Rust */}
                  {server.game === 'rust' && server.seed && server.worldSize && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <FiMap className="text-primary mr-3" />
                        Mapa do Servidor
                      </h3>
                      <RustMapPreview seed={server.seed} worldSize={server.worldSize} />
                    </div>
                  )}

                  {/* Connect Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <FiServer className="text-primary mr-3" />
                      Conectar ao Servidor
                    </h3>
                    <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-200">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="bg-dark-400 p-3 rounded-md flex-grow font-mono">
                          <code className="text-gray-300">{server.address}</code>
                        </div>
                        {server.game === 'rust' && server.connectCommand && (
                          <Button
                            variant="primary"
                            onClick={() => copyToClipboard(server.connectCommand)}
                            className="flex items-center"
                          >
                            <FiClipboard className="mr-2" />
                            {copySuccess ? 'Copiado!' : 'Copiar Comando F1'}
                          </Button>
                        )}
                      </div>
                      
                      {server.game === 'rust' && (
                        <p className="text-gray-400 text-sm mt-3">
                          Você também pode se conectar pelo Steam usando o botão abaixo:
                        </p>
                      )}
                      
                      <div className="mt-3">
                        <a 
                          href={`steam://connect/${server.address}`}
                          className="inline-flex items-center bg-[#1b2838] text-white py-2 px-4 rounded hover:bg-[#2a3f5a] transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.3 3.6 9.8 8.4 11.1.1 0 .3 0 .3-.2v-2.1c0-.1 0-.1-.1-.2-1.8-.5-2.5-1.4-2.9-2.2l-.1-.1c-.3-.7-.7-1.3-1.2-1.9 0-.1-.1-.1-.1-.2 0-.1.1-.1.2-.1.3 0 .9.4 1.1.5 1.3.9 1.9 1.1 2.7 1.4.1 0 .2 0 .3-.1.6-.5.7-1.7.5-2.4 0-.1 0-.1.1-.2.2 0 .3.1.3.2.5 1.2 1.8 2 3.4 2h.8c.1 0 .2-.1.2-.2v-.8c0-.1 0-.1.1-.2.8-.2 1.2-.6 1.3-1.2 0-.1.1-.1.2-.1.1 0 .2.1.2.1 0 1.4-1.2 2.5-2.8 2.7-.1 0-.1.1-.1.1V19.5c0 .1.1.2.2.2 4.9-1.2 8.5-5.7 8.5-11.1-0.1-6-5.1-11.1-11.6-11.1zM9 10.9c-1.6 0-2.9-1.3-2.9-2.9s1.3-2.9 2.9-2.9 2.9 1.3 2.9 2.9c-.1 1.5-1.3 2.8-2.9 2.9zm6.7 0c-1.6 0-2.9-1.3-2.9-2.9s1.3-2.9 2.9-2.9 2.9 1.3 2.9 2.9c-.1 1.5-1.3 2.8-2.9 2.9z" />
                          </svg>
                          Conectar via Steam
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Tab Panel */}
              {activeTab === 'leaderboard' && (
                <div className="p-6">
                  <Leaderboard 
                    leaderboard={leaderboard} 
                    formatPlaytime={formatPlaytime} 
                    formatDate={formatDate} 
                  />
                </div>
              )}

              {/* Events Tab Panel */}
              {activeTab === 'events' && (
                <div className="p-6">
                  <div className="mb-6 flex items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <FiCalendar className="text-primary mr-3" />
                      Próximos Eventos
                    </h3>
                  </div>
                  
                  {!events || events.length === 0 ? (
                    <div className="bg-dark-400 rounded-lg p-8 text-center">
                      <p className="text-gray-300">Nenhum evento programado no momento.</p>
                      <p className="text-gray-400 text-sm mt-2">Fique de olho no nosso Discord para anúncios de eventos.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {events.map(event => (
                        <Card key={event.id} variant="darker" padding="none" className="overflow-hidden border border-dark-200 hover:border-primary/30 transition-all duration-300">
                          {event.image && (
                            <div className="h-48 overflow-hidden">
                              <Image 
                                src={event.image} 
                                alt={event.title}
                                width={500}
                                height={300}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                          
                          <div className="p-5">
                            <h4 className="text-lg font-semibold text-white mb-2">{event.title}</h4>
                            
                            <div className="flex items-center text-primary mb-3">
                              <FiCalendar className="mr-2" />
                              <span>{formatDateTime(event.date)}</span>
                            </div>
                            
                            <p className="text-gray-300 mb-3">{event.description}</p>
                            
                            {event.location && (
                              <div className="flex items-center text-gray-400 text-sm">
                                <FiMap className="mr-2" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rules Tab Panel */}
              {activeTab === 'rules' && (
                <div className="p-6">
                  <div className="mb-6 flex items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <FiList className="text-primary mr-3" />
                      Regras do Servidor
                    </h3>
                  </div>
                  
                  {!server.rules || server.rules.length === 0 ? (
                    <div className="bg-dark-400 rounded-lg p-8 text-center">
                      <p className="text-gray-300">Nenhuma regra específica definida para este servidor.</p>
                    </div>
                  ) : (
                    <div className="bg-dark-400/50 p-6 rounded-lg border border-dark-200">
                      <ol className="space-y-3">
                        {server.rules.map((rule, index) => (
                          <li key={index} className="flex items-start">
                            <div className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="text-gray-300">{rule}</span>
                          </li>
                        ))}
                      </ol>
                      
                      {server.adminContacts && server.adminContacts.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-dark-300">
                          <h4 className="text-white font-medium mb-3">Contatos dos Administradores:</h4>
                          <div className="flex flex-wrap gap-3">
                            {server.adminContacts.map((admin, index) => (
                              <div key={index} className="bg-dark-300 px-3 py-1 rounded-lg text-gray-300 text-sm">
                                {admin}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* VIP Benefits Section */}
        <section className="py-12 bg-gradient-to-t from-dark-300 to-dark-400 border-t border-dark-200">
          <div className="container-custom mx-auto px-4">
            <div className="bg-dark-400/80 p-8 rounded-xl border border-primary/30 backdrop-blur-sm">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Melhore sua Experiência com VIP
                </h2>
                <p className="text-gray-300 mb-6">
                  Obtenha vantagens exclusivas, kits especiais e prioridade na fila adquirindo um de nossos planos VIP.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  href="/planos"
                >
                  Ver Planos VIP
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}