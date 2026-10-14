import React, { useMemo } from 'react';

export default function SpaceBackground() {
  // Generate random starry background
  const stars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      top: `${(i * 19) % 100}%`,
      left: `${(i * 23 + 7) % 100}%`,
      size: i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.8 : 1.2,
      opacity: 0.2 + (i % 6) * 0.12,
      delay: `${(i % 5) * 0.9}s`,
      duration: `${3 + (i % 4)}s`
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#060A17]">
      {/* 1. Deep Space Cosmic Radial Gradients (Soothing, eye-friendly, not glaring) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,#0E1B38_0%,#081024_45%,#050814_100%)]" />
      
      {/* Soft Nebula Dust Clouds */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute top-1/2 -right-32 w-[650px] h-[600px] rounded-full bg-emerald-600/8 blur-[150px]" />
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />

      {/* 2. Twinkling Distant Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            boxShadow: s.size > 2 ? '0 0 6px 1px rgba(255, 255, 255, 0.8)' : 'none',
            animation: `starTwinkle ${s.duration} ease-in-out infinite ${s.delay}`
          }}
        />
      ))}

      {/* 3. Meteor / Shooting Stars (瞬间划过、转瞬即逝的效果) */}
      {/* Meteor 1 */}
      <div
        className="meteor"
        style={{
          top: '12%',
          right: '18%',
          animationDuration: '6.5s',
          animationDelay: '0.4s'
        }}
      />

      {/* Meteor 2 */}
      <div
        className="meteor"
        style={{
          top: '25%',
          right: '8%',
          animationDuration: '8.2s',
          animationDelay: '2.5s'
        }}
      />

      {/* Meteor 3 */}
      <div
        className="meteor"
        style={{
          top: '6%',
          right: '42%',
          animationDuration: '7.4s',
          animationDelay: '4.8s'
        }}
      />

      {/* Meteor 4 */}
      <div
        className="meteor"
        style={{
          top: '35%',
          right: '25%',
          animationDuration: '9.5s',
          animationDelay: '1.2s'
        }}
      />

      {/* Meteor 5 */}
      <div
        className="meteor"
        style={{
          top: '18%',
          right: '65%',
          animationDuration: '10.5s',
          animationDelay: '6.2s'
        }}
      />
    </div>
  );
}
