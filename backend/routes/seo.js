const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateTournamentSchema,
  generateMatchSchema,
  generateBreadcrumbSchema,
  generateFAQSchema
} = require('../utils/schemaGenerator');

// Get schema for homepage
router.get('/schema/home', (req, res) => {
  const schemas = [
    generateOrganizationSchema(),
    generateWebsiteSchema()
  ];
  res.json({ schemas });
});

// Get schema for tournament page
router.get('/schema/tournament/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    
    const schema = generateTournamentSchema(tournament);
    res.json({ schema });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get schema for match page
router.get('/schema/match/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    const schema = generateMatchSchema(match);
    res.json({ schema });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get breadcrumb schema
router.post('/schema/breadcrumb', (req, res) => {
  const { items } = req.body;
  const schema = generateBreadcrumbSchema(items);
  res.json({ schema });
});

// Get FAQ schema
router.get('/schema/faq', (req, res) => {
  const faqs = [
    { question: "How do I join a tournament?", answer: "Register on BattleZone, add funds to your wallet, and click 'Join' on any tournament." },
    { question: "What is the minimum withdrawal amount?", answer: "The minimum withdrawal amount is ₹100." },
    { question: "How long does KYC verification take?", answer: "KYC verification typically takes 24-48 hours." },
    { question: "Are tournaments refundable?", answer: "Entry fees are non-refundable once the tournament starts." }
  ];
  const schema = generateFAQSchema(faqs);
  res.json({ schema });
});

// Generate XML sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL;
    const matches = await Match.find({ status: 'upcoming' }).limit(100);
    const tournaments = await Tournament.find({ status: 'upcoming' }).limit(100);
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    sitemap += `  <url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    
    // Static pages
    const pages = ['matches', 'tournaments', 'leaderboard', 'about', 'contact', 'faq'];
    pages.forEach(page => {
      sitemap += `  <url><loc>${baseUrl}/${page}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });
    
    // Dynamic matches
    matches.forEach(match => {
      sitemap += `  <url><loc>${baseUrl}/matches/${match._id}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>\n`;
    });
    
    // Dynamic tournaments
    tournaments.forEach(tournament => {
      sitemap += `  <url><loc>${baseUrl}/tournaments/${tournament._id}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
    });
    
    sitemap += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /user/profile
Sitemap: ${process.env.FRONTEND_URL}/api/seo/sitemap.xml`;
  
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;
