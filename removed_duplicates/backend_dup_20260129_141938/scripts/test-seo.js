// SEO Testing Script
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const tests = [
  {
    name: 'Homepage Schema',
    endpoint: '/api/seo/schema/home',
    validate: (data) => data.schemas && data.schemas.length > 0
  },
  {
    name: 'FAQ Schema',
    endpoint: '/api/seo/schema/faq',
    validate: (data) => data.schema && data.schema['@type'] === 'FAQPage'
  },
  {
    name: 'Sitemap XML',
    endpoint: '/api/seo/sitemap.xml',
    validate: (data) => data.includes('<?xml') && data.includes('urlset')
  },
  {
    name: 'Robots.txt',
    endpoint: '/api/seo/robots.txt',
    validate: (data) => data.includes('User-agent') && data.includes('Sitemap')
  }
];

async function runTests() {
  console.log('🧪 Running SEO Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await axios.get(`${BASE_URL}${test.endpoint}`);
      const isValid = test.validate(response.data);
      
      if (isValid) {
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED (Invalid response)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED (${error.message})`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
