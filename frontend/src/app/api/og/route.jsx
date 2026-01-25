import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const title = searchParams.get('title') || 'BattleZone - Esports Platform';
  const subtitle = searchParams.get('subtitle') || 'Play BGMI & PUBG Tournaments for Real Money';
  const category = searchParams.get('category') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          position: 'relative',
        }}
      >
        {/* Grid Pattern Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Gradient Orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px',
            zIndex: 10,
          }}
        >
          {/* Category Badge */}
          {category && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 24px',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '50px',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  color: '#00ffff',
                  fontSize: '20px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: title.length > 40 ? '48px' : '56px',
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
              maxWidth: '900px',
              textShadow: '0 0 40px rgba(0, 255, 255, 0.5)',
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              margin: '24px 0 0 0',
              maxWidth: '700px',
            }}
          >
            {subtitle}
          </p>

          {/* Stats Row */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎮</span>
              <span style={{ color: '#00ffff', fontSize: '18px', fontWeight: 600 }}>50K+ Players</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
              <span style={{ color: '#00ffff', fontSize: '18px', fontWeight: 600 }}>₹10L+ Prizes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <span style={{ color: '#00ffff', fontSize: '18px', fontWeight: 600 }}>Instant Withdraw</span>
            </div>
          </div>
        </div>

        {/* Logo/Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00ffff 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '24px' }}>🎮</span>
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            BattleZone
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
