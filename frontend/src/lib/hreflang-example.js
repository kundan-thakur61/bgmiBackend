// Hreflang implementation for multilingual support
// Add this to your Next.js pages for international SEO

export const metadata = {
  alternates: {
    canonical: 'https://battlezone.com/tournaments',
    languages: {
      'en-IN': 'https://battlezone.com/en/tournaments',
      'hi-IN': 'https://battlezone.com/hi/tournaments',
      'x-default': 'https://battlezone.com/tournaments'
    }
  }
};

// Example usage in page component
export default function TournamentsPage() {
  return (
    <>
      {/* Page content */}
    </>
  );
}

// For dynamic routes
export async function generateMetadata({ params }) {
  const { locale, id } = params;
  
  return {
    alternates: {
      canonical: `https://battlezone.com/${locale}/tournaments/${id}`,
      languages: {
        'en-IN': `https://battlezone.com/en/tournaments/${id}`,
        'hi-IN': `https://battlezone.com/hi/tournaments/${id}`,
        'x-default': `https://battlezone.com/tournaments/${id}`
      }
    }
  };
}
