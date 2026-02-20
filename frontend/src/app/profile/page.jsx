'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Demo / Mock Data ────────────────────────────────────────────────────────
const demoUser = {
  username: 'ProGamer123',
  email: 'progamer@example.com',
  phone: '9876543210',
  gameId: '5123456789',
  kycStatus: 'verified',
  matchesPlayed: 45,
  matchesWon: 12,
  totalWinnings: 5680,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  rank: 'Diamond',
  level: 42,
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, prefix = '', suffix = '', duration = 1200 }) {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const numericTarget = typeof target === 'number' ? target : parseFloat(target) || 0;
    startTime.current = null;

    const step = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * numericTarget));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return (
    <span>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent = '#00ff87' }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const prefix = typeof value === 'string' && value.includes('₹') ? '₹' : '';
  const suffix = typeof value === 'string' && value.includes('%') ? '%' : '';

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px 16px',
      textAlign: 'center',
      overflow: 'hidden',
      transition: 'border-color 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent + '55';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }} />
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px',
        color: accent, fontFamily: "'Rajdhani', monospace",
        lineHeight: 1,
      }}>
        <AnimatedNumber target={numericValue} prefix={prefix} suffix={suffix} />
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Field Row ───────────────────────────────────────────────────────────────
function ProfileField({ label, value, icon, editValue, onChange, isEditing, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px',
        color: 'rgba(255,255,255,0.35)', fontWeight: 600,
      }}>
        <span style={{ marginRight: '6px' }}>{icon}</span>{label}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={editValue}
          onChange={e => onChange(e.target.value)}
          style={{
            background: 'rgba(0,255,135,0.05)',
            border: '1px solid rgba(0,255,135,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '15px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#00ff87';
            e.target.style.boxShadow = '0 0 0 3px rgba(0,255,135,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(0,255,135,0.3)';
            e.target.style.boxShadow = 'none';
          }}
        />
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '15px',
          letterSpacing: '0.2px',
        }}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

// ─── Quick Link Card ─────────────────────────────────────────────────────────
function QuickLink({ href, icon, label, color }) {
  return (
    <a href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '22px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.3s, transform 0.3s, background 0.3s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = color + '66';
          e.currentTarget.style.background = color + '0d';
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.3px' }}>
          {label}
        </div>
      </div>
    </a>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ username, level }) {
  const letter = (username || 'U')[0].toUpperCase();
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Outer glow ring */}
      <div style={{
        position: 'absolute', inset: '-4px',
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #00ff87, #60efff, #7b5ea7, #00ff87)',
        animation: 'spin 4s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: '-1px',
        borderRadius: '50%',
        background: '#0d0d14',
      }} />
      <div style={{
        position: 'relative',
        width: '96px', height: '96px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00ff87 0%, #0066ff 50%, #7b5ea7 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '36px', fontWeight: 900, color: '#0d0d14',
        fontFamily: "'Rajdhani', sans-serif",
        zIndex: 1,
      }}>
        {letter}
      </div>
      {/* Level badge */}
      <div style={{
        position: 'absolute', bottom: '-4px', right: '-4px',
        background: 'linear-gradient(135deg, #00ff87, #00cc6a)',
        color: '#0d0d14',
        fontSize: '11px', fontWeight: 800,
        padding: '2px 7px',
        borderRadius: '20px',
        border: '2px solid #0d0d14',
        zIndex: 2,
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.5px',
      }}>
        Lv.{level}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = demoUser; // Replace with: const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    gameId: user.gameId || '',
  });

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API
    setLoading(false);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const winRate = Math.round((user.matchesWon / user.matchesPlayed) * 100);

  const stats = [
    { label: 'Matches Played', value: user.matchesPlayed, icon: '🎮', accent: '#60efff' },
    { label: 'Matches Won', value: user.matchesWon, icon: '🏆', accent: '#ffd700' },
    { label: 'Win Rate', value: winRate, icon: '📈', suffix: '%', accent: '#00ff87' },
    { label: 'Total Winnings', value: user.totalWinnings, icon: '💰', prefix: '₹', accent: '#ff6b6b' },
  ];

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        @keyframes savedAnim {
          0% { transform: scale(0.8); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0d14; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,135,0.3); border-radius: 3px; }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0d1a1a inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0d0d14',
        color: '#fff',
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: '80px',
      }}>

        {/* Background grid */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none',
        }} />

        {/* Minimal Navbar */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(13,13,20,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 24px',
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '22px', fontWeight: 700, letterSpacing: '2px',
            color: '#00ff87',
          }}>
            ARENA<span style={{ color: '#fff', opacity: 0.6 }}>X</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {['Tournaments', 'Leaderboard', 'Wallet'].map(item => (
              <a key={item} href="#" style={{
                color: 'rgba(255,255,255,0.45)', fontSize: '14px', textDecoration: 'none',
                letterSpacing: '0.3px', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              >
                {item}
              </a>
            ))}
          </div>
        </nav>

        <main style={{ position: 'relative', zIndex: 1, maxWidth: '880px', margin: '0 auto', padding: '48px 20px 0' }}>

          {/* Page heading */}
          <div style={{ marginBottom: '32px', animation: 'fadeIn 0.5s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '3px', height: '28px', background: '#00ff87', borderRadius: '2px' }} />
              <h1 style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '32px', fontWeight: 700, letterSpacing: '1px', color: '#fff',
              }}>
                PLAYER PROFILE
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginLeft: '13px' }}>
              Manage your account and view your stats
            </p>
          </div>

          {/* Main Profile Card */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '20px',
            animation: 'fadeIn 0.5s ease 0.1s both',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Corner decoration */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '200px', height: '200px',
              background: 'radial-gradient(circle at top right, rgba(0,255,135,0.04), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginBottom: '28px' }}>
              <Avatar username={user.username} level={user.level} />

              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '26px', fontWeight: 700, letterSpacing: '0.5px',
                  }}>
                    {user.username}
                  </h2>
                  {user.kycStatus === 'verified' && (
                    <span style={{
                      background: 'rgba(0,255,135,0.12)',
                      border: '1px solid rgba(0,255,135,0.35)',
                      color: '#00ff87',
                      fontSize: '10px', fontWeight: 700,
                      padding: '3px 9px', borderRadius: '20px',
                      letterSpacing: '1px', textTransform: 'uppercase',
                    }}>
                      ✓ Verified
                    </span>
                  )}
                  <span style={{
                    background: 'rgba(96,239,255,0.1)',
                    border: '1px solid rgba(96,239,255,0.25)',
                    color: '#60efff',
                    fontSize: '10px', fontWeight: 700,
                    padding: '3px 9px', borderRadius: '20px',
                    letterSpacing: '1px', textTransform: 'uppercase',
                  }}>
                    💎 {user.rank}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
                  Member since {formatDate(user.createdAt)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '3px' }}>
                  Game ID: <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{user.gameId}</span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {saved && (
                  <span style={{
                    color: '#00ff87', fontSize: '13px', fontWeight: 600,
                    animation: 'savedAnim 0.4s ease',
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}>
                    ✓ Saved!
                  </span>
                )}
                <button
                  onClick={() => { setIsEditing(!isEditing); if (isEditing) setFormData({ username: user.username, email: user.email, phone: user.phone, gameId: user.gameId }); }}
                  style={{
                    background: isEditing ? 'rgba(255,255,255,0.06)' : 'rgba(0,255,135,0.08)',
                    border: `1px solid ${isEditing ? 'rgba(255,255,255,0.15)' : 'rgba(0,255,135,0.35)'}`,
                    color: isEditing ? 'rgba(255,255,255,0.6)' : '#00ff87',
                    padding: '9px 20px', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.3px',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {isEditing ? '✕ Cancel' : '✎ Edit Profile'}
                </button>
              </div>
            </div>

            {/* Win rate bar */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>Win Rate</span>
                <span style={{ fontSize: '12px', color: '#00ff87', fontWeight: 700 }}>{winRate}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  background: 'linear-gradient(90deg, #00ff87, #60efff)',
                  width: `${winRate}%`,
                  transition: 'width 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '28px',
            }}>
              {stats.map(s => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '28px' }} />

            {/* Form Fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}>
              <ProfileField
                label="Username" icon="👤"
                value={user.username}
                editValue={formData.username}
                onChange={v => setFormData({ ...formData, username: v })}
                isEditing={isEditing}
              />
              <ProfileField
                label="Email" icon="✉" type="email"
                value={user.email}
                editValue={formData.email}
                onChange={v => setFormData({ ...formData, email: v })}
                isEditing={isEditing}
              />
              <ProfileField
                label="Phone" icon="📱" type="tel"
                value={user.phone}
                editValue={formData.phone}
                onChange={v => setFormData({ ...formData, phone: v })}
                isEditing={isEditing}
              />
              <ProfileField
                label="Game ID" icon="🎯"
                value={user.gameId}
                editValue={formData.gameId}
                onChange={v => setFormData({ ...formData, gameId: v })}
                isEditing={isEditing}
              />
            </div>

            {/* Save button */}
            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', animation: 'slideIn 0.3s ease' }}>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    background: loading ? 'rgba(0,255,135,0.4)' : 'linear-gradient(135deg, #00ff87, #00cc6a)',
                    border: 'none',
                    color: '#0d0d14',
                    padding: '11px 32px', borderRadius: '10px',
                    fontSize: '14px', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                    fontFamily: "'Rajdhani', sans-serif",
                    transition: 'opacity 0.2s, transform 0.2s',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: '14px' }}>⟳</span>
                      Saving...
                    </>
                  ) : 'Save Changes →'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            animation: 'fadeIn 0.5s ease 0.25s both',
          }}>
            <QuickLink href="/kyc" icon="📋" label="KYC Verification" color="#60efff" />
            <QuickLink href="/tickets" icon="🎫" label="Support Tickets" color="#ffd700" />
            <QuickLink href="/notifications" icon="🔔" label="Notifications" color="#ff6b6b" />
            <QuickLink href="/wallet" icon="💳" label="Wallet" color="#00ff87" />
          </div>

          {/* Footer note */}
          <p style={{
            textAlign: 'center', marginTop: '48px',
            color: 'rgba(255,255,255,0.15)', fontSize: '12px', letterSpacing: '0.5px',
          }}>
            ARENAX © 2025 — All game data is updated in real-time
          </p>
        </main>
      </div>
    </>
  );
}