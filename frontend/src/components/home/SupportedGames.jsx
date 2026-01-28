import '@/styles/hero-styles.css';

const games = [
    { name: 'PUBG Mobile', icon: '🎯', description: 'Classic, TDM, and Arena matches' },
    { name: 'Free Fire', icon: '🔥', description: 'Battle royale and clash squad' },
    { name: 'BGMI', icon: '🎮', description: 'All modes supported' },
];

export default function SupportedGames() {
    return (
        <section className="py-24 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent" />

            <div className="relative max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                        <span className="text-white">SUPPORTED </span>
                        <span className="neon-text">GAMES</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                        Compete in your favorite mobile esports games with players across India
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {games.map((game, index) => (
                        <div
                            key={game.name}
                            className="game-card p-8 rounded-2xl text-center bg-gray-900/50"
                            style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                            }}
                        >
                            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-300 will-change-transform translate-z-0">
                                {game.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white hero-title">
                                {game.name}
                            </h3>
                            <p className="text-gray-400 font-light">
                                {game.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
