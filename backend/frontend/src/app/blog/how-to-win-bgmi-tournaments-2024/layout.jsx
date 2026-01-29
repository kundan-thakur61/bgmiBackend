import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'How to Win BGMI Tournaments in 2024 - Expert Guide',
  description: 'Master BGMI tournaments with pro tips, strategies, and winning tactics. Learn how to dominate competitive matches and earn real money on BattleZone.',
  keywords: 'BGMI tournament tips, BGMI winning strategy, BGMI pro tips, how to win BGMI, BGMI competitive guide, BGMI tournament strategy',
  url: '/blog/how-to-win-bgmi-tournaments-2024',
  type: 'article',
});

export default function BlogLayout({ children }) {
  return children;
}
