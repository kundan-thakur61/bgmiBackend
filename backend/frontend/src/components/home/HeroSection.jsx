'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/hero-styles.css';

const stats = [
    { value: '50K+', label: 'Active Players' },
    { value: '₹10L+', label: 'Monthly Prizes' },
    { value: '1000+', label: 'Daily Matches' },
    { value: '99.9%', label: 'Uptime' },
];

export default function HeroSection() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const particlePositions = useMemo(() => {
        const particleCount = typeof window !== 'undefined' ?
            (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 6 : 12 : 12;

        return Array.from({ length: particleCount }, (_, i) => ({
            left: ((i * 17 + 13) % 100),
            delay: ((i * 3 + 7) % 10),
            duration: 10 + ((i * 2) % 4)
        }));
    }, []);

    return (
        <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 cyber-grid opacity-30" />
            <div className="scanline" />

            {/* Particle Effects - Optimized */}
            <div className="particle-bg hidden sm:block">
                {mounted && window.innerWidth > 768 && particlePositions.map((pos, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${pos.left}%`,
                            animationDelay: `${pos.delay}s`,
                            animationDuration: `${pos.duration}s`,
                            willChange: 'transform, opacity'
                        }}
                    />
                ))}
            </div>

            {/* Gradient Orbs - Optimized */}
            <div className="absolute top-20 left-1/4 w-[60vw] max-w-[600px] h-[60vw] max-h-[600px] bg-cyan-500/10 sm:bg-cyan-500/20 rounded-full blur-[40px] sm:blur-[120px] animate-pulse will-change-transform translate-z-0" />
            <div className="absolute top-40 right-1/4 w-[50vw] max-w-[500px] h-[50vw] max-h-[500px] bg-purple-500/10 sm:bg-purple-500/20 rounded-full blur-[40px] sm:blur-[120px] animate-pulse will-change-transform translate-z-0" style={{ animationDelay: '1s' }} />

            <div className="relative max-w-7xl mx-auto text-center">
                {/* Live Indicator Badge */}
                <div className="inline-flex items-center px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-cyan-500/30 mb-10 holographic">
                    <span className="w-3 h-3 bg-cyan-400 rounded-full mr-3 live-indicator" style={{ boxShadow: '0 0 10px #00ffff' }} />
                    <span className="text-sm font-semibold text-cyan-300 tracking-wider uppercase">Live Matches Available Now</span>
                </div>

                {/* Main Heading */}
                <h1 className="hero-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl mb-8">
                    <span className="block mb-2 text-white" style={{
                        animation: 'fadeInUp 0.8s ease-out',
                        textShadow: '0 0 30px rgba(255,255,255,0.5)'
                    }}>
                        PLAY COMPETITIVE
                    </span>
                    <span className="block neon-text mb-2" style={{ animationDelay: '0.2s' }}>
                        ESPORTS MATCHES
                    </span>
                    <span className="block text-white" style={{
                        animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
                        backgroundImage: 'linear-gradient(135deg, #fff, #00ffff, #ff00ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        FOR REAL MONEY
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed" style={{
                    animation: 'fadeInUp 0.8s ease-out 0.6s backwards'
                }}>
                    Join <span className="text-cyan-400 font-semibold">BattleZone</span>, India&apos;s fastest-growing esports platform for
                    PUBG Mobile and Free Fire tournaments. <span className="text-purple-400">Compete, win, and withdraw instantly.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20" style={{
                    animation: 'fadeInUp 0.8s ease-out 0.8s backwards'
                }}>
                    <Link
                        href="/register"
                        className="cta-button px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-lg font-bold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
                        style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)' }}
                    >
                        Start Playing Now
                    </Link>
                    <Link
                        href="/how-it-works"
                        className="cta-button px-10 py-5 bg-transparent border-2 border-cyan-400 text-cyan-400 rounded-lg text-lg font-bold hover:bg-cyan-400/10 transition-all duration-300 hover:scale-105"
                    >
                        How It Works
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="stat-glow"
                            style={{
                                animation: `fadeInUp 0.8s ease-out ${1 + index * 0.1}s backwards`
                            }}
                        >
                            <div className="text-5xl sm:text-6xl font-black hero-title neon-text mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm sm:text-base text-gray-400 uppercase tracking-widest font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
