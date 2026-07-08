/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, LineChart, Egg, TrendingUp, Users, Zap, CheckCircle } from 'lucide-react';

interface OnboardingHeroProps {
  onStart: () => void;
  onGoToLogin: () => void;
}

// Animation utility hook
const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible };
};

export default function OnboardingHero({ onStart, onGoToLogin }: OnboardingHeroProps) {
  const heroRef = useIntersectionObserver({ threshold: 0.1 });
  const featuresRef = useIntersectionObserver({ threshold: 0.1 });
  const ctaRef = useIntersectionObserver({ threshold: 0.1 });

  const features = [
    { icon: LineChart, title: 'Rentabilidade Comprovada', desc: 'Otimize ração e acompanhe margem de lucro em tempo real.', color: 'green', delay: 0 },
    { icon: Egg, title: 'Alta Produtividade', desc: 'Monitore taxa de postura e viabilidade dos animais.', color: 'brand', delay: 100 },
    { icon: TrendingUp, title: 'Crescimento Sustentável', desc: 'Tomada de decisão baseada em dados concretos.', color: 'blue', delay: 200 },
    { icon: Users, title: 'Equipe Feliz', desc: 'Interface intuitiva que economiza tempo no dia a dia.', color: 'purple', delay: 300 },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-brand-main via-white to-blue-50 text-on-surface antialiased overflow-x-hidden">
      {/* Left Side: Hero Image Spot and Advantages */}
      <div className="relative w-full md:w-1/2 bg-gradient-to-br from-[#0f1c2b] to-[#1a2d42] flex-shrink-0 overflow-hidden h-[300px] sm:h-[350px] md:min-h-screen">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] hover:scale-105"
          style={{ backgroundImage: `url('/hero_background.png')` }}
        />
        
        {/* Modern Dark/Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1c2b] via-[#0f1c2b]/70 to-transparent md:bg-gradient-to-r md:from-transparent md:via-[#0f1c2b]/80 md:to-[#0f1c2b]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/40 to-purple-600/30 mix-blend-overlay"></div>

        {/* Floating Particles for visual interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 12}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Floating Advantages */}
        <div ref={featuresRef.ref} className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 lg:p-12 pb-8 sm:pb-10 md:pb-12 lg:pb-24 pointer-events-none z-10">
          
          <div className="hidden md:flex flex-col gap-3 md:gap-4 max-w-xs md:max-w-sm mb-auto mt-8 md:mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 md:p-5 rounded-2xl shadow-2xl transition-all duration-500 hover:bg-white/15 hover:translate-x-2 hover:shadow-3xl"
                style={{
                  opacity: featuresRef.isVisible ? 1 : 0,
                  transform: featuresRef.isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${feature.delay}ms`
                }}
              >
                <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                  <div className={`p-2 md:p-3 rounded-xl ${
                    feature.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    feature.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    feature.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-brand-primary/20 text-brand-primary'
                  }`}>
                    <feature.icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  </div>
                  <h4 className="text-white font-bold text-sm md:text-base">{feature.title}</h4>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-white md:hidden mt-auto pb-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">O futuro da sua<br/>produção caipira.</h3>
            <p className="text-sm sm:text-lg text-slate-200">Gestão profissional, lucro real.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Content & Actions Area */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-8 relative flex-grow bg-white/80 backdrop-blur-sm overflow-y-auto">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

        <div ref={heroRef.ref} className="max-w-md sm:max-w-lg mx-auto md:mx-0 w-full relative z-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center md:items-start mb-8 sm:mb-10" style={{
            opacity: heroRef.isVisible ? 1 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.6s ease-out'
          }}>
            <div className="relative">
              <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-brand-primary/20 to-purple-500/20 rounded-full blur-xl"></div>
              <img
                  src="/logo.png"
                  alt="Logo Granja de Bolso"
                  className="object-contain drop-shadow-xl max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[250px] w-auto h-auto relative z-10"
                />
            </div>
          </div>

          {/* Typography Heading */}
          <div style={{
            opacity: heroRef.isVisible ? 1 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.1s'
          }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f1c2b] leading-tight mb-4 tracking-tight">
              Gestão Inteligente para sua Granja Caipira
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[#414752] leading-relaxed mb-6 sm:mb-8 font-medium">
              Eficiência, rastreabilidade e controle total da sua operação avícola, direto na palma da sua mão. Seus dados estão sempre seguros e disponíveis de onde você estiver.
            </p>
          </div>

          {/* Quick Benefits List */}
          <div className="mb-8 sm:mb-10 space-y-2 sm:space-y-3" style={{
            opacity: heroRef.isVisible ? 1 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.2s'
          }}>
            {[
              'Controle completo de lotes e animais',
              'Cálculo automático de ração e custos',
              'Relatórios detalhados de produtividade',
              'Backup automático na nuvem'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3 text-[#0f1c2b]">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <span className="font-medium text-xs sm:text-sm md:text-base">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Actions Column */}
          <div ref={ctaRef.ref} className="flex flex-col gap-3 sm:gap-4 w-full" style={{
            opacity: heroRef.isVisible ? 1 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.3s'
          }}>
            <button
              onClick={onStart}
              id="btn-start"
              className="group w-full inline-flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-brand-primary to-brand-hover text-white font-bold px-6 sm:px-8 py-3 sm:py-4 hover:from-brand-hover hover:to-brand-primary active:scale-[0.98] transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-brand-primary/25 rounded-full cursor-pointer"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onGoToLogin}
              id="btn-goto-login"
              className="w-full inline-flex items-center justify-center bg-white border-2 border-gray-200 hover:border-brand-primary text-brand-primary font-bold px-6 sm:px-8 py-3 sm:py-4 hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-all duration-300 hover:shadow-lg rounded-full cursor-pointer"
            >
              Já tenho uma conta
            </button>
          </div>

          {/* Trust Meta Indicator */}
          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200/60 flex items-center gap-3 sm:gap-4" style={{
            opacity: heroRef.isVisible ? 1 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.4s'
          }}>
            <div className="flex-shrink-0 p-2 sm:p-3 bg-brand-primary/10 rounded-full">
              <ShieldCheck className="text-brand-primary w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-gray-700 font-bold text-xs sm:text-sm">Segurança e Confiança</p>
              <p className="text-gray-500 text-xs sm:text-sm">Feito por quem entende: criado de avicultor para avicultor.</p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 sm:mt-8 flex items-center gap-4 sm:gap-6 justify-center md:justify-start opacity-70" style={{
            opacity: heroRef.isVisible ? 0.7 : 0,
            transform: heroRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.5s'
          }}>
            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>Fácil de Usar</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>100% Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
