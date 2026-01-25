// Analytics API endpoint
const metrics = { lcp: [], fid: [], cls: [], keywords: {}, sessions: [] };

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { name, value } = req.body;
    
    if (name === 'LCP') metrics.lcp.push(value);
    else if (name === 'FID') metrics.fid.push(value);
    else if (name === 'CLS') metrics.cls.push(value);
    else if (name === 'keywords') metrics.keywords = value;
    else if (name === 'session') metrics.sessions.push(value);
    
    return res.status(200).json({ success: true });
  }
  
  if (req.method === 'GET' && req.url.includes('/summary')) {
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
    
    return res.status(200).json({
      lcp: Math.round(avg(metrics.lcp)),
      fid: Math.round(avg(metrics.fid)),
      cls: avg(metrics.cls),
      keywords: Object.entries(metrics.keywords).reduce((acc, [k, v]) => {
        acc[k] = v.position;
        return acc;
      }, {}),
      avgSession: avg(metrics.sessions.map(s => s.duration)),
      avgScroll: avg(metrics.sessions.map(s => s.scrollDepth)),
      totalClicks: metrics.sessions.reduce((sum, s) => sum + s.clicks, 0)
    });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
