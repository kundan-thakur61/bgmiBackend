import { generateMetadata as genMeta } from '@/lib/seo';

export async function generateMetadata({ params }) {
  // Fetch match data for metadata
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}/matches/${params.id}`, {
      next: { revalidate: 60 }, // Revalidate every minute
    });
    
    if (!response.ok) {
      return genMeta({
        title: 'Match Details',
        description: 'View match details on BattleZone',
        url: `/matches/${params.id}`,
      });
    }
    
    const data = await response.json();
    const match = data.match;
    
    if (!match) {
      return genMeta({
        title: 'Match Details',
        description: 'View match details on BattleZone',
        url: `/matches/${params.id}`,
      });
    }
    
    const title = `${match.title} - Join Now | BattleZone`;
    const description = `Join ${match.title} on BattleZone. Entry: ₹${match.entryFee}, Prize: ₹${match.prizePool}. ${match.mode} ${match.matchType} match. ${match.gameType?.replace('_', ' ')}. Register now!`;
    const keywords = [
      match.title,
      `${match.gameType} match`,
      `${match.mode} match`,
      'BGMI tournament',
      'Free Fire tournament',
      'esports match',
      'real money gaming',
    ].filter(Boolean).join(', ');
    
    return genMeta({
      title,
      description,
      keywords,
      url: `/matches/${params.id}`,
      image: match.banner?.url || '/og-matches.jpg',
      type: 'website',
    });
  } catch (error) {
    return genMeta({
      title: 'Match Details',
      description: 'View match details on BattleZone',
      url: `/matches/${params.id}`,
    });
  }
}

export default function MatchLayout({ children }) {
  return children;
}

