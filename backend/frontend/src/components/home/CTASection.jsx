import Link from 'next/link';
import '@/styles/hero-styles.css';

export default function CTASection() {
    return (
        <section className="py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 holographic" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

            <div className="relative max-w-4xl mx-auto text-center">
                <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                    <span className="text-white">READY TO START </span>
                    <span className="neon-text">WINNING?</span>
                </h2>
                <p className="text-xl text-gray-300 mb-12 font-light">
                    Join <span className="text-cyan-400 font-semibold">thousands of players</span> competing daily for real prizes
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link
                        href="/register"
                        className="cta-button px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-lg text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 will-change-transform translate-z-0"
                        style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
                    >
                        Create Free Account
                    </Link>
                    <Link
                        href="/matches"
                        className="cta-button px-12 py-6 bg-transparent border-2 border-purple-400 text-purple-400 rounded-lg text-xl font-bold hover:bg-purple-400/10 transition-all duration-300 hover:scale-105 will-change-transform translate-z-0"
                    >
                        Browse Matches
                    </Link>
                </div>
            </div>
        </section>
    );
}
