import { generateMetadata as genMeta } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  // Fetch tournament data for metadata
  const API_BASE_URL = (await import('@/lib/api')).API_BASE_URL;

  try {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      return genMeta({
        title: 'Tournament Details',
        description: 'View tournament details on BattleZone',
        url: `/tournaments/${id}`,
      });
    }

    const data = await response.json();
    const tournament = data.tournament;

    if (!tournament) {
      return genMeta({
        title: 'Tournament Details',
        description: 'View tournament details on BattleZone',
        url: `/tournaments/${id}`,
      });
    }

    const title = `${tournament.title || tournament.name} - Register Now | BattleZone`;
    const description = `Join ${tournament.title || tournament.name} tournament on BattleZone. Prize Pool: ₹${tournament.prizePool}, Entry: ₹${tournament.entryFee}. ${tournament.mode} ${tournament.format} format. Register now!`;
    const keywords = [
      tournament.title || tournament.name,
      'BGMI tournament',
      'Free Fire tournament',
      'esports tournament',
      `${tournament.mode} tournament`,
      'real money gaming',
      'competitive gaming',
    ].filter(Boolean).join(', ');

    return genMeta({
      title,
      description,
      keywords,
      url: `/tournaments/${id}`,
      image: tournament.banner?.url || '/og-tournaments.jpg',
      type: 'website',
    });
  } catch (error) {
    return genMeta({
      title: 'Tournament Details',
      description: 'View tournament details on BattleZone',
      url: `/tournaments/${id}`,
    });
  }
}

export default function TournamentLayout({ children }) {
  return children;
}

