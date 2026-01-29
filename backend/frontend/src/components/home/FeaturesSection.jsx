import '@/styles/hero-styles.css';

const features = [
    {
        icon: '🎮',
        title: 'Multiple Game Modes',
        description: 'Solo, Duo, Squad matches and tournaments for PUBG Mobile & Free Fire',
    },
    {
        icon: '💰',
        title: 'Real Money Prizes',
        description: 'Win real cash prizes and withdraw instantly to your bank account',
    },
    {
        icon: '🛡️',
        title: 'Fair Play Guaranteed',
        description: 'Advanced anti-cheat system and manual verification for fair results',
    },
    {
        icon: '⚡',
        title: 'Instant Withdrawals',
        description: '24-48 hour withdrawal processing via UPI or bank transfer',
    },
];

export default function FeaturesSection() {
    return (
        <section className="py-24 px-4 relative">
            <div className="absolute inset-0 cyber-grid opacity-10" />

            <div className="relative max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                        <span className="text-white">WHY CHOOSE </span>
                        <span className="neon-text">BATTLEZONE?</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                        The most trusted and feature-rich esports platform in India
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="feature-card p-8 rounded-2xl"
                            style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
                            }}
                        >
                            <div className="text-6xl mb-6 transform hover:rotate-12 transition-transform duration-300 will-change-transform translate-z-0">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-cyan-400 tracking-wide">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
