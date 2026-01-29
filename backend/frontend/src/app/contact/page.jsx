'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-dark-900 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4 font-display gradient-text">Contact Us</h1>
                        <p className="text-dark-400 text-lg">
                            We're here to help! Choose the best way to reach us below.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Support Tickets */}
                        <div className="card p-8 hover:border-primary-500/50 transition-colors">
                            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-6 text-primary-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Support Tickets</h2>
                            <p className="text-dark-400 mb-6">
                                For account issues, payment problems, or match disputes, the fastest way to get help is by creating a support ticket.
                            </p>
                            <Link href="/tickets" className="btn-primary w-full text-center block">
                                Open Ticket
                            </Link>
                        </div>

                        {/* Email Support */}
                        <div className="card p-8 hover:border-gaming-purple/50 transition-colors">
                            <div className="w-12 h-12 bg-gaming-purple/10 rounded-lg flex items-center justify-center mb-6 text-gaming-purple">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Email Support</h2>
                            <p className="text-dark-400 mb-6">
                                For business inquiries, partnerships, or general questions, you can reach us via email.
                            </p>
                            <a href="mailto:support@battlezone.com" className="btn-secondary w-full text-center block">
                                support@battlezone.com
                            </a>
                        </div>

                        {/* Social Media */}
                        <div className="card p-8 col-span-1 md:col-span-2 hover:border-blue-500/50 transition-colors">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-bold mb-2">Join Our Discord</h2>
                                    <p className="text-dark-400">
                                        Join our community for real-time support, match announcements, and giveaways.
                                    </p>
                                </div>
                                <a
                                    href="https://discord.gg/BattleZone"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                                    </svg>
                                    Join Server
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
