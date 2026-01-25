# BattleZone SEO Launch Guide

## Complete Checklist for Google #1 Ranking

---

## 1. Google Search Console Setup

### Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **URL prefix** and enter: `https://battlezone.gg` (your domain)
4. Verify ownership using one of these methods:
   - **HTML file upload** (recommended) - download and add to `/public`
   - **DNS record** - add TXT record to your domain
   - **HTML tag** - add meta tag to layout.jsx

### Step 2: Submit Sitemap

1. In Search Console, go to **Sitemaps**
2. Enter: `sitemap.xml`
3. Click **Submit**
4. Verify status shows "Success"

Your dynamic sitemap is available at: `https://yourdomain.com/sitemap.xml`

### Step 3: Request Indexing (Priority Pages)

Use **URL Inspection** tool for each priority page:

| Priority | URL | Action |
|----------|-----|--------|
| 1 | `/` | Request Indexing |
| 2 | `/blog/bgmi-tournament-guide-2026` | Request Indexing |
| 3 | `/matches` | Request Indexing |
| 4 | `/tournaments` | Request Indexing |
| 5 | `/how-it-works` | Request Indexing |
| 6 | `/blog` | Request Indexing |

**Process:**
1. Paste URL in search bar
2. Click "Request Indexing"
3. Wait for "Indexing requested" confirmation
4. Note: Limited to ~10 requests per day

---

## 2. Technical SEO Verification

### Schema Markup Validation

Test your structured data using these tools:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Test homepage for Organization + WebApplication schemas
   - Test `/blog/bgmi-tournament-guide-2026` for Article + HowTo + FAQ schemas
   - Test `/how-it-works` for HowTo schema

2. **Schema.org Validator**: https://validator.schema.org/
   - Paste your page URL or HTML
   - Verify no errors, only warnings

### Expected Rich Results

| Page | Expected Rich Result |
|------|---------------------|
| Homepage | Sitelinks, FAQ dropdown |
| BGMI Guide | Article with date, HowTo steps, FAQ accordion |
| How It Works | HowTo carousel with steps |
| Matches | FAQ dropdown |

### Core Web Vitals

Monitor in Search Console under **Core Web Vitals**:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

Test with: https://pagespeed.insights.web.dev/

---

## 3. Ranking Monitoring Setup

### Free Tools

1. **Google Search Console** (Primary)
   - Go to Performance > Search Results
   - Filter by query: "bgmi tournament"
   - Track: Position, Clicks, Impressions, CTR

2. **Bing Webmaster Tools**
   - https://www.bing.com/webmasters
   - Submit sitemap and monitor rankings

### Recommended Paid Tools

| Tool | Price | Best For |
|------|-------|----------|
| SEMrush | $129/mo | Comprehensive tracking |
| Ahrefs | $99/mo | Backlink analysis |
| Mangools | $29/mo | Budget-friendly |
| SE Ranking | $39/mo | Accurate positions |

### Keywords to Track

**Primary Keywords:**
- bgmi tournament
- bgmi tournament 2026
- bgmi tournaments india
- pubg mobile tournament india

**Secondary Keywords:**
- free fire tournament
- esports tournament india
- mobile gaming tournament
- bgmi tournament app

**Long-tail Keywords:**
- how to join bgmi tournament
- best bgmi tournament app india
- bgmi tournament registration 2026
- win money playing bgmi

### Tracking Schedule

| Metric | Frequency | Tool |
|--------|-----------|------|
| Keyword positions | Daily | SE Ranking / SEMrush |
| Search Console data | Weekly | Google Search Console |
| Core Web Vitals | Monthly | PageSpeed Insights |
| Backlink profile | Monthly | Ahrefs / SEMrush |

---

## 4. Content Calendar (Next 90 Days)

### Month 1: Foundation

| Week | Content | Target Keyword |
|------|---------|----------------|
| 1 | BGMI Tournament Guide 2026 (DONE) | bgmi tournament |
| 2 | Top 10 BGMI Players India 2026 | bgmi players india |
| 3 | How to Improve KD in BGMI | bgmi kd ratio |
| 4 | BGMI Sensitivity Settings Guide | bgmi sensitivity |

### Month 2: Expansion

| Week | Content | Target Keyword |
|------|---------|----------------|
| 5 | Free Fire Tournament Guide 2026 | free fire tournament |
| 6 | PUBG Mobile vs BGMI Comparison | pubg mobile india |
| 7 | Best Phones for BGMI 2026 | best phone for bgmi |
| 8 | Esports Career Guide India | esports career india |

### Month 3: Authority Building

| Week | Content | Target Keyword |
|------|---------|----------------|
| 9 | BGMI Clan Wars Strategy | bgmi clan |
| 10 | Mobile Esports Future in India | mobile esports india |
| 11 | Tournament Hosting Guide | host bgmi tournament |
| 12 | Gaming Withdrawal/Earnings Tips | esports earnings |

---

## 5. Link Building Strategy

### Quick Wins (Week 1-2)

1. **Gaming Directories**
   - Submit to esports directories
   - Gaming platform listings
   - App review sites

2. **Social Profiles**
   - Create profiles on all gaming platforms
   - Discord server with website link
   - YouTube channel with description link

3. **Community Engagement**
   - Reddit: r/BGMI, r/PUBGMobile, r/IndianGaming
   - Quora: Answer BGMI tournament questions
   - Gaming forums participation

### Outreach (Month 1-2)

1. **Gaming News Sites**
   - Sportskeeda Esports
   - AFK Gaming
   - TalkEsport
   - AnimationXpress

2. **Tech Blogs**
   - Digit
   - 91mobiles
   - Beebom
   - TechPP

3. **YouTube Collaborations**
   - Contact BGMI streamers
   - Offer tournament partnerships
   - Sponsorship mentions

### Guest Post Targets

- Gaming blogs accepting guest posts
- Esports news sites
- Tech and gaming combo sites
- Mobile gaming focused blogs

---

## 6. OG Image Implementation

### Dynamic OG Images

Your OG image API is now available at:
```
/api/og?title=Your+Title&subtitle=Your+Subtitle&category=Guide
```

### Usage in Pages

```javascript
export const metadata = {
  openGraph: {
    images: [{
      url: '/api/og?title=BGMI+Tournament+Guide+2026&subtitle=Win+Real+Money&category=Guide',
      width: 1200,
      height: 630,
    }],
  },
};
```

### Test OG Images

- https://www.opengraph.xyz/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/

---

## 7. Performance Benchmarks

### Week 1 Goals
- [ ] All pages indexed in Google
- [ ] Schema validation passing
- [ ] Core Web Vitals all green
- [ ] Search Console showing impressions

### Month 1 Goals
- [ ] BGMI Tournament Guide ranking top 50
- [ ] 1,000+ impressions/week
- [ ] 5+ backlinks acquired
- [ ] 10+ indexed pages

### Month 3 Goals
- [ ] Main keyword top 10
- [ ] 10,000+ impressions/week
- [ ] 100+ clicks/week
- [ ] 25+ quality backlinks

### Month 6 Goals
- [ ] Main keyword top 3
- [ ] 50,000+ impressions/week
- [ ] 1,000+ clicks/week
- [ ] Domain Rating 30+

---

## 8. Troubleshooting

### Page Not Indexing

1. Check robots.txt allows crawling
2. Verify no noindex tag
3. Check for canonical issues
4. Ensure page loads quickly
5. Submit via URL Inspection

### Rankings Dropping

1. Check Search Console for manual actions
2. Review Core Web Vitals
3. Analyze competitor changes
4. Check for content cannibalization
5. Review backlink profile for toxic links

### Rich Results Not Showing

1. Validate schema with Google's tool
2. Ensure schema is properly nested
3. Check for required fields
4. Wait 2-4 weeks after indexing
5. Ensure page has enough authority

---

## 9. Monthly SEO Checklist

### Weekly Tasks
- [ ] Check Search Console for errors
- [ ] Monitor keyword positions
- [ ] Publish 1-2 new content pieces
- [ ] Engage on social/community

### Monthly Tasks
- [ ] Full technical audit
- [ ] Core Web Vitals review
- [ ] Backlink analysis
- [ ] Competitor analysis
- [ ] Content optimization of existing pages

### Quarterly Tasks
- [ ] Full site audit
- [ ] Strategy review
- [ ] Content pruning/updating
- [ ] Link building campaign review

---

## 10. Quick Reference Commands

### Verify Build
```bash
cd frontend
npm run build
```

### Test Locally
```bash
npm run dev
```

### Check Sitemap
Visit: `http://localhost:3000/sitemap.xml`

### Test OG Images
Visit: `http://localhost:3000/api/og?title=Test&category=Blog`

---

## Success Metrics Dashboard

Create a simple tracking spreadsheet:

| Date | Keyword | Position | Impressions | Clicks | CTR |
|------|---------|----------|-------------|--------|-----|
| Week 1 | bgmi tournament | - | 0 | 0 | 0% |
| Week 2 | | | | | |
| Week 4 | | | | | |
| Week 8 | | | | | |
| Week 12 | | | | | |

---

**Remember:** SEO is a marathon, not a sprint. Consistent effort over 3-6 months will yield results. Focus on creating genuinely helpful content and the rankings will follow.

Good luck ranking #1 for "BGMI Tournament"! 🎮🏆
