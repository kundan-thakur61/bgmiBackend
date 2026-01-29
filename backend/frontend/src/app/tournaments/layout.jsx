import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'BGMI & Free Fire Tournaments - Daily Competitions',
  description: 'Join daily BGMI and Free Fire tournaments. Compete with top players, win massive cash prizes. Solo, Duo, Squad formats. Register now and start winning!',
  keywords: 'BGMI tournaments, Free Fire tournaments, daily competitions, esports tournaments India, gaming competitions, online tournaments',
  url: '/tournaments',
});

export default function TournamentsLayout({ children }) {
  return children;
}
