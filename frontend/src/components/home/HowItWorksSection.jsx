import '@/styles/hero-styles.css';

const steps = [
    { step: '1', title: 'Sign Up', desc: 'Create your free account in seconds', color: 'cyan' },
    { step: '2', title: 'Add Funds', desc: 'Deposit money securely via UPI/Cards', color: 'purple' },
    { step: '3', title: 'Join Match', desc: 'Pick a match and receive room details', color: 'pink' },
    { step: '4', title: 'Win & Withdraw', desc: 'Win prizes and withdraw anytime', color: 'blue' },
];

export default function HowItWorksSection() {
    return (
        <section className="py-24 px-4 bg-black/40">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="hero-title text-4xl sm:text-5xl md:text-6xl mb-6">
                        <span className="text-white">HOW IT </span>
                        <span className="neon-text">WORKS</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((item, index) => (
                        <div
                            key={item.step}
                            className="text-center"
                            style={{
                                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                            }}
                        >
                            <div className={`step-indicator w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-45`}>
                                <span className="hero-title text-3xl font-black text-white -rotate-45">
                                    {item.step}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white tracking-wide">
                                {item.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
