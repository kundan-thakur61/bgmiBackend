import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Gaming Tips, Guides & Esports News - BattleZone Blog',
  description: 'Expert BGMI & Free Fire tips, tournament strategies, esports news, and gaming guides. Learn from pro players and dominate the competition.',
  keywords: 'BGMI tips, Free Fire guide, esports news India, gaming strategies, tournament tips, pro player guides',
  url: '/blog',
});

export default function BlogLayout({ children }) {
  return children;
}
