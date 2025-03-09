import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { 
  FaDiscord, 
  FaGamepad, 
  FaRocket, 
  FaShieldAlt, 
  FaServer, 
  FaUsers, 
  FaChevronRight,
  FaCrown,
  FaSteam,
  FaArrowRight,
  FaCheck
} from 'react-icons/fa';
import { SiRust } from 'react-icons/si';
import { toast } from 'react-hot-toast';

// Animated background component
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden z-0">
    <div className="absolute inset-0 bg-dark-400 opacity-90"></div>
    <div className="absolute w-full h-full bg-[url('/images/rust_banner3.png')] bg-cover bg-center bg-no-repeat opacity-30 scale-105 animate-slow-zoom"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-dark-400/20 via-dark-400/90 to-dark-300"></div>
  </div>
);

// Server status card component - ATUALIZADO PARA DADOS REAIS
const ServerStatusCard = () => {
  const [serverData, setServerData] = useState({
    name: "Carregando...",
    players: 0,
    maxPlayers: 0,
    status: "offline"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [communitySize, setCommunitySize] = useState(0);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const response = await fetch('/api/servers');
        if (response.ok) {
          const servers = await response.json();
          if (servers && servers.length > 0) {
            // Pegar o primeiro servidor da lista
            setServerData({
              name: servers[0].name,
              players: servers[0].players,
              maxPlayers: servers[0].maxPlayers,
              status: servers[0].status
            });
          }
        }
        
        // Também buscar estatísticas da comunidade
        const statsResponse = await fetch('/api/stats/overview');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setCommunitySize(statsData.totalPlayers || 0);
        }
      } catch (error) {
        console.error("Error fetching server data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerData();
    // Atualizar a cada 1 minuto
    const interval = setInterval(fetchServerData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-dark-400 rounded-lg overflow-hidden border border-dark-200 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 group">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <div className="flex items-center">
                <SiRust className="text-primary mr-2 text-lg" />
                <h3 className="font-bold text-white">{serverData.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                serverData.status === 'online' ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'
              }`}>
                {serverData.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm">Players</span>
                  <span className="text-white text-sm font-medium">{serverData.players}/{serverData.maxPlayers}</span>
                </div>
                <div className="w-full bg-dark-300 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary transition-all duration-500 group-hover:bg-gradient-to-r from-primary to-orange-400" 
                    style={{ width: `${Math.min((serverData.players / serverData.maxPlayers) * 100, 100)}%` }}></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">
                  <FaUsers className="inline mr-1 text-primary" /> Comunidade Ativa
                </span>
                <span className="text-white font-medium group-hover:text-primary transition-colors">{communitySize}+</span>
              </div>
            </div>
            
            <Link 
              href="/servers" 
              className="flex items-center justify-center w-full mt-4 py-2 bg-dark-300 rounded text-gray-300 group-hover:text-primary transition-all hover:bg-dark-200"
            >
              Ver detalhes <FaChevronRight className="ml-1 text-xs transition-transform group-hover:translate-x-1" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

// Testimonial component
const Testimonial = ({ name, text, avatar }) => (
  <div className="relative bg-dark-400/60 rounded-lg p-6 border border-dark-200 backdrop-blur-sm">
    <div className="absolute top-0 right-0 -mt-3 -mr-3 text-4xl text-primary opacity-20">"</div>
    <p className="text-gray-300 mb-4 italic relative z-10">{text}</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
        <Image 
          src={avatar} 
          alt={name} 
          width={40}
          height={40}
          className="object-cover"
        />
      </div>
      <div>
        <h4 className="text-white font-medium">{name}</h4>
        <p className="text-gray-400 text-sm">Jogador VIP</p>
      </div>
    </div>
  </div>
);

// Feature card component
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gradient-to-br from-dark-400 to-dark-300 rounded-lg p-6 border border-dark-200 shadow-lg group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
    <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-lg w-16 h-16 flex items-center justify-center mb-5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">
      {description}
    </p>
  </div>
);

// Plan card component
const PlanPreviewCard = ({ name, price, popular, features }) => (
  <div className={`relative overflow-hidden rounded-xl transition-all duration-300 h-full flex flex-col ${
    popular 
      ? 'shadow-lg border-2 border-primary' 
      : 'shadow border border-dark-200'
  }`}>
    {popular && (
      <div className="absolute -right-12 top-5 bg-primary text-white py-1 px-10 transform rotate-45 text-sm font-bold">
        Popular
      </div>
    )}
    
    <div className={`p-6 ${popular ? 'bg-gradient-to-br from-primary/10 to-dark-300' : 'bg-dark-300'}`}>
      <h3 className="text-xl font-bold text-white mb-2 flex items-center">
        {name}
        {popular && <FaCrown className="ml-2 text-yellow-500 text-sm" />}
      </h3>
      <div className="flex items-baseline mb-4">
        <span className="text-2xl font-extrabold text-white">R${price}</span>
        <span className="text-gray-400 ml-1">/mês</span>
      </div>
    </div>
    
    <div className="bg-dark-400 p-6 flex-grow flex flex-col">
      <ul className="space-y-2 mb-6 flex-grow">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">
              <FaCheck className="h-3 w-3" />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        variant={popular ? 'primary' : 'outline'}
        size="md"
        fullWidth
        href="/planos"
        className="mt-auto"
      >
        Ver Detalhes
      </Button>
    </div>
  </div>
);

// Custom animated counter hook
const useCounter = (end, start = 0, duration = 2000, delay = 0) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    if (!window.IntersectionObserver) {
      setCount(end);
      return;
    }
    
    let observer;
    let timeoutId;
    let startTime;
    let animationFrameId;
    
    const element = document.getElementById('stats-section');
    
    const handleIntersection = (entries) => {
      const entry = entries[0];
      
      if (entry.isIntersecting) {
        timeoutId = setTimeout(() => {
          startTime = Date.now();
          
          const updateCount = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const currentCount = Math.floor(progress * (end - start) + start);
            
            setCount(currentCount);
            
            if (progress < 1) {
              animationFrameId = requestAnimationFrame(updateCount);
            } else {
              setCount(end);
            }
          };
          
          updateCount();
        }, delay);
        
        observer.unobserve(element);
      }
    };
    
    observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      if (element && observer) {
        observer.unobserve(element);
      }
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, start, duration, delay]);
  
  return count;
};

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // NOVO: Estado para estatísticas reais
  const [stats, setStats] = useState({
    playerCount: 0,
    serverCount: 0,
    plansCount: 0
  });
  
  // Buscar estatísticas reais
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/overview');
        if (response.ok) {
          const data = await response.json();
          setStats({
            playerCount: data.totalPlayers || 0,
            serverCount: data.totalServers || 0,
            plansCount: data.activeSubscriptions || 0
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, []);
  
  // Usar os dados reais nas animações de contador
  const playerCount = useCounter(stats.playerCount, 0, 1500, 200);
  const serverCount = useCounter(stats.serverCount, 0, 1000, 200);
  const plansCount = useCounter(stats.plansCount, 0, 2000, 200);

  // Verifica se o usuário foi redirecionado para login
  useEffect(() => {
    if (router.query.login === 'true' && !session) {
      toast.error('Faça login para continuar');
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.query, session]);

  return (
    <div className="flex flex-col min-h-screen bg-dark-400">
      {/* Hero Section - Modern and Immersive */}
      <section className="relative min-h-[90vh] flex items-center">
        <AnimatedBackground />
        
        <div className="container-custom mx-auto px-4 pt-20 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center space-x-3">
                  <div className="h-px w-10 bg-primary"></div>
                  <span className="text-primary font-medium uppercase tracking-wider text-sm">Phanteon Games</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  Eleve Sua <span className="text-gradient">Experiência</span> no Servidor
                </h1>
                
                <p className="text-lg text-gray-300 leading-relaxed">
                  Obtenha vantagens exclusivas, itens especiais e prioridade nos 
                  melhores servidores de Rust com nossos planos VIP.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {!session ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => signIn('discord')}
                      className="group flex items-center justify-center"
                    >
                      <FaDiscord className="mr-2 text-lg" />
                      Entrar com Discord
                      <FaArrowRight className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      href="/planos"
                      className="group flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                      <FaRocket className="mr-2 text-lg" />
                      Ver Planos VIP
                      <FaArrowRight className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    href="/servers"
                    className="group"
                  >
                    <FaServer className="mr-2" />
                    Servidores
                    <FaChevronRight className="ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
                
                <div className="pt-6 flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-dark-300 overflow-hidden">
                        <img 
                          src={`/badges/badge_${i === 3 ? 'plus' : 'basic'}.svg`} 
                          alt="User Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">
                    Os <span className="text-primary font-semibold">jogadores</span> confiam em nós
                  </div>
                </div>
              </div>
            </div>
          
            <div className="order-1 lg:order-2 relative">
              <div className="relative transform hover:scale-[1.02] transition-all duration-500">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 opacity-30 rounded-xl blur-xl group-hover:opacity-50 transition-all duration-500"></div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-dark-200">
                  <Image 
                    src="/images/rust_banner5.png" 
                    alt="Phanteon Games Rust Server" 
                    width={600}
                    height={450}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-bold text-xl">Rust Survival</h3>
                        <p className="text-gray-300 text-sm">Servidor Brasileiro de Rust</p>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm"
                        href="/servers/32225312"
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark-300 to-transparent z-10"></div>
      </section>

      {/* Server Status Section */}
      <section className="py-16 bg-dark-300 relative">
        <div className="container-custom mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center">
              <FaServer className="text-primary mr-3" />
              Nossos Servidores
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServerStatusCard />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - ATUALIZADO PARA DADOS REAIS */}
      <section id="stats-section" className="py-12 bg-gradient-to-r from-dark-400 to-dark-300 relative">
        <div className="container-custom mx-auto px-4">
          <div className="flex flex-wrap justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="text-center p-6 bg-dark-400/50 rounded-lg border border-dark-200 backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-primary mb-2">{playerCount.toLocaleString()}+</h2>
                <p className="text-gray-300">Jogadores Ativos</p>
              </div>
              
              <div className="text-center p-6 bg-dark-400/50 rounded-lg border border-dark-200 backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-primary mb-2">{serverCount}</h2>
                <p className="text-gray-300">Servidores Online</p>
              </div>
              
              <div className="text-center p-6 bg-dark-400/50 rounded-lg border border-dark-200 backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-primary mb-2">{plansCount.toLocaleString()}+</h2>
                <p className="text-gray-300">Assinaturas VIP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid Layout */}
      <section className="py-24 bg-dark-400 relative">
        <div className="container-custom mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Benefícios <span className="text-primary">VIP</span> Exclusivos
            </h2>
            <p className="text-gray-400">
              Obtenha vantagens especiais e melhore sua experiência nos servidores Phanteon Games 
              com nossos planos VIP customizados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaRocket className="text-primary text-2xl" />}
              title="Vantagens Exclusivas"
              description="Acesso a recursos e benefícios exclusivos para membros VIP, incluindo itens especiais e bônus únicos."
            />

            <FeatureCard 
              icon={<FaGamepad className="text-primary text-2xl" />}
              title="Recursos Premium"
              description="Desbloqueie comandos e funcionalidades especiais que melhoram sua experiência nos servidores."
            />

            <FeatureCard 
              icon={<FaShieldAlt className="text-primary text-2xl" />}
              title="Suporte Dedicado"
              description="Acesso prioritário ao suporte, canais exclusivos no Discord e participação em eventos especiais."
            />
            
            <FeatureCard 
              icon={<FaSteam className="text-primary text-2xl" />}
              title="Kits Especiais"
              description="Receba kits exclusivos com itens raros e úteis para acelerar seu progresso no jogo."
            />
            
            <FeatureCard 
              icon={<FaUsers className="text-primary text-2xl" />}
              title="Comunidade VIP"
              description="Participe de uma comunidade exclusiva com outros membros VIP, eventos e sorteios especiais."
            />
            
            <FeatureCard 
              icon={<FaServer className="text-primary text-2xl" />}
              title="Prioridade na Fila"
              description="Nunca mais espere para entrar no servidor. Membros VIP têm acesso prioritário e garantido."
            />
          </div>
        </div>
      </section>
      
      {/* Plans Preview Section */}
      <section className="py-24 bg-dark-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <div className="container-custom mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Nossos Planos <span className="text-primary">VIP</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Escolha o plano que melhor se adapta ao seu estilo de jogo e desfrute de benefícios exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PlanPreviewCard 
              name="VIP Basic"
              price="19.90"
              popular={false}
              features={[
                "Acesso ao plugin Furnace Splitter",
                "Prioridade na fila do servidor",
                "Kit básico a cada wipe",
                "Badge exclusiva no Discord",
                "Cargo exclusivo no Discord"
              ]}
            />
            
            <PlanPreviewCard 
              name="VIP Plus"
              price="29.90"
              popular={true}
              features={[
                "Acesso ao plugin Furnace Splitter",
                "Acesso ao plugin QuickSmelt",
                "Prioridade máxima na fila",
                "Kit avançado a cada wipe",
                "Suporte prioritário"
              ]}
            />
          </div>
          
          <div className="text-center mt-10">
            <Button
              variant="outline"
              size="lg"
              href="/planos"
              className="group"
            >
              Ver Todos os Planos
              <FaArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24 bg-dark-400 relative">
        <div className="container-custom mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              O Que Nossos <span className="text-primary">Jogadores</span> Dizem
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Confira as experiências de jogadores que já aproveitam os benefícios VIP em nossos servidores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial 
              name="Ricardo Sousa"
              text="Ser VIP na Phanteon Games transformou minha experiência no servidor de Rust. Os kits especiais e a prioridade na fila são essenciais durante os dias de wipe!"
              avatar="/badges/badge_basic.svg"
            />
            
            <Testimonial 
              name="Amanda Ribeiro"
              text="O VIP Plus vale muito a pena! O plugin QuickSmelt economiza muito tempo e os itens exclusivos ajudam bastante no início do jogo. Recomendo!"
              avatar="/badges/badge_plus.svg"
            />
            
            <Testimonial 
              name="Carlos Eduardo"
              text="Estou na comunidade há mais de 6 meses e o suporte para membros VIP é excelente. Sempre que precisei de ajuda, a equipe resolveu rapidamente."
              avatar="/badges/badge_basic.svg"
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced Visuals */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-orange-600/30 opacity-20"></div>
        <div className="absolute inset-0 bg-dark-300"></div>
        <div className="absolute inset-0 bg-[url('/images/rust_banner3.png')] bg-cover bg-center opacity-10"></div>
        
        <div className="container-custom mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center bg-dark-400/80 p-10 rounded-2xl border border-primary/30 backdrop-blur-sm shadow-2xl transform hover:scale-[1.01] transition-all duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para elevar sua experiência?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de jogadores que já aproveitam todas as vantagens VIP. 
              Assine agora e comece a aproveitar imediatamente todos os benefícios.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                href="/planos"
                className="group px-8"
              >
                Ver Planos VIP
                <FaArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                href="https://discord.gg/v8575VMgPW"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <FaDiscord className="mr-2" />
                Entrar no Discord
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Scroll Button - Fixed at bottom */}
      <button 
        className={`fixed bottom-8 right-8 bg-primary/80 hover:bg-primary text-white p-3 rounded-full shadow-lg z-50 backdrop-blur-sm transition-all duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao topo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}