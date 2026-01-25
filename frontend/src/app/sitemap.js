import { seoConfig } from '@/lib/seo';

export default async function sitemap() {
  const baseUrl = seoConfig.siteUrl;
  const now = new Date();
  
  // Static routes
  const staticRoutes = [
    { url: '', changeFrequency: 'daily', priority: 1.0 },
    { url: '/matches', changeFrequency: 'hourly', priority: 0.9 },
    { url: '/tournaments', changeFrequency: 'daily', priority: 0.9 },
    { url: '/leaderboard', changeFrequency: 'daily', priority: 0.8 },
    { url: '/how-it-works', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/blog', changeFrequency: 'daily', priority: 0.8 },
    { url: '/blog/how-to-win-bgmi-tournaments-2024', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/faq', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/rules', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/fair-play', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4 },
    { url: '/terms-conditions', changeFrequency: 'yearly', priority: 0.4 },
  ];

  // Dynamic routes - fetch from API
  const dynamicRoutes = [];
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Fetch upcoming matches
    try {
      const matchesResponse = await fetch(`${API_BASE_URL}/matches?status=upcoming,registration_open&limit=100`, {
        next: { revalidate: 3600 }, // Revalidate every hour
      });
      
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const matches = matchesData.matches || matchesData.data || [];
        
        matches.forEach(match => {
          dynamicRoutes.push({
            url: `/matches/${match._id || match.id}`,
            changeFrequency: 'hourly',
            priority: 0.8,
            lastModified: match.updatedAt || match.createdAt || now,
          });
        });
      }
    } catch (error) {
      console.error('Error fetching matches for sitemap:', error);
    }
    
    // Fetch upcoming tournaments
    try {
      const tournamentsResponse = await fetch(`${API_BASE_URL}/tournaments?status=upcoming,registration_open&limit=100`, {
        next: { revalidate: 3600 }, // Revalidate every hour
      });
      
      if (tournamentsResponse.ok) {
        const tournamentsData = await tournamentsResponse.json();
        const tournaments = tournamentsData.tournaments || tournamentsData.data || [];
        
        tournaments.forEach(tournament => {
          dynamicRoutes.push({
            url: `/tournaments/${tournament._id || tournament.id}`,
            changeFrequency: 'daily',
            priority: 0.9,
            lastModified: tournament.updatedAt || tournament.createdAt || now,
          });
        });
      }
    } catch (error) {
      console.error('Error fetching tournaments for sitemap:', error);
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
  }

  // Combine all routes
  const allRoutes = [
    ...staticRoutes.map(route => ({
      url: `${baseUrl}${route.url}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...dynamicRoutes.map(route => ({
      url: `${baseUrl}${route.url}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
  ];

  return allRoutes;
}
