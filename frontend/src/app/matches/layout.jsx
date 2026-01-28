import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Live BGMI & Free Fire Matches - Join Now',
  description: 'Join live BGMI and Free Fire matches. Win real cash prizes. Solo, Duo, Squad tournaments. Instant withdrawals. Play now on India\'s #1 esports platform.',
  keywords: 'BGMI matches, Free Fire matches, live tournaments, esports matches, gaming tournaments India, PUBG Mobile matches, competitive gaming',
  url: '/matches',
});

export default function MatchesLayout({ children }) {
  return children;
}
