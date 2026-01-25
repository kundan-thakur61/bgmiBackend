import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata.blog;

const blogPosts = [
  {
    slug: 'bgmi-tournament-guide-2026',
    title: 'BGMI Tournament Guide 2026 - Complete Guide to Winning Real Money',
    excerpt: 'Master BGMI tournaments in 2026. Learn how to join tournaments, win real money, pro strategies, and step-by-step registration process.',
    image: '/blog/bgmi-tournament-guide-2026.jpg',
    category: 'Ultimate Guide',
    date: '2026-01-15',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'pubg-mobile-tips-for-beginners',
    title: '10 Essential PUBG Mobile Tips for Beginners',
    excerpt: 'Master the basics of PUBG Mobile with these essential tips. Learn about landing spots, weapon selection, and survival strategies.',
    image: '/blog/pubg-tips.jpg',
    category: 'Tips & Tricks',
    date: '2025-12-28',
    readTime: '5 min read',
  },
  {
    slug: 'best-landing-spots-erangel',
    title: 'Best Landing Spots in Erangel 2025',
    excerpt: 'Discover the top landing spots in Erangel for high-tier loot and strategic advantage. Updated for the latest season.',
    image: '/blog/erangel-spots.jpg',
    category: 'Strategy',
    date: '2025-12-25',
    readTime: '7 min read',
  },
  {
    slug: 'free-fire-character-guide',
    title: 'Free Fire Character Guide: Best Characters for Ranked',
    excerpt: 'Complete guide to Free Fire characters. Learn which characters are best for different playstyles and team compositions.',
    image: '/blog/ff-characters.jpg',
    category: 'Guides',
    date: '2025-12-22',
    readTime: '8 min read',
  },
  {
    slug: 'how-to-improve-aim-mobile',
    title: 'How to Improve Your Aim in Mobile Gaming',
    excerpt: 'Professional tips to improve your aim and reflexes. Includes sensitivity settings, practice routines, and finger placement.',
    image: '/blog/aim-guide.jpg',
    category: 'Tips & Tricks',
    date: '2025-12-20',
    readTime: '6 min read',
  },
  {
    slug: 'esports-career-india',
    title: 'Building an Esports Career in India',
    excerpt: 'Everything you need to know about pursuing a professional esports career in India. From practice routines to team recruitment.',
    image: '/blog/esports-career.jpg',
    category: 'Esports',
    date: '2025-12-18',
    readTime: '10 min read',
  },
  {
    slug: 'bgmi-update-latest-features',
    title: 'BGMI Latest Update: New Features & Changes',
    excerpt: 'Complete breakdown of the latest BGMI update including new maps, weapons, game modes, and balance changes.',
    image: '/blog/bgmi-update.jpg',
    category: 'News',
    date: '2025-12-15',
    readTime: '4 min read',
  },
];

const categories = ['All', 'Tips & Tricks', 'Strategy', 'Guides', 'Esports', 'News'];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="py-12 px-4 bg-gradient-to-b from-primary-900/20 to-dark-900">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-4">
              Gaming <span className="gradient-text">Blog</span>
            </h1>
            <p className="text-lg text-dark-300 max-w-2xl mx-auto">
              Tips, strategies, and news to help you dominate in PUBG Mobile, BGMI, and Free Fire
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 px-4 border-b border-dark-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    category === 'All'
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <Link href={`/blog/${blogPosts[0].slug}`} className="block group">
              <div className="card overflow-hidden md:flex">
                <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-primary-600 to-gaming-purple flex items-center justify-center">
                  <span className="text-6xl">🎮</span>
                </div>
                <div className="p-6 md:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge badge-primary">{blogPosts[0].category}</span>
                    <span className="text-dark-400 text-sm">{blogPosts[0].date}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary-400 transition-colors">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-dark-300 mb-4">{blogPosts[0].excerpt}</p>
                  <span className="text-primary-400 font-medium">
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-12 px-4 bg-dark-800/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold font-display mb-8">Latest Articles</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.slice(1).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <article className="card-hover h-full flex flex-col">
                    <div className="h-48 bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center rounded-t-lg">
                      <span className="text-4xl">📝</span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                          {post.category}
                        </span>
                        <span className="text-dark-500 text-xs">{post.readTime}</span>
                      </div>
                      <h3 className="font-bold mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-dark-400 text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="mt-4 text-dark-500 text-sm">{post.date}</div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="btn-outline px-8">
                Load More Articles
              </button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold font-display mb-4">Stay Updated</h2>
            <p className="text-dark-400 mb-6">
              Get the latest gaming tips and tournament updates delivered to your inbox
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
