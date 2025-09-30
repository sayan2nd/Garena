
'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, Sparkle } from 'lucide-react';

interface WelcomeAnimationProps {
  coins?: number;
}

export default function WelcomeAnimation({ coins }: WelcomeAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, 3500); // A little longer than the animation to ensure it completes

    return () => clearTimeout(timer);
  }, []);

  const coinParticles = Array.from({ length: 12 });

  return (
    <Dialog open={true}>
      <DialogContent className="bg-transparent border-none shadow-none w-full max-w-md p-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8">
            {/* Main animated icon */}
            <div className="relative inline-block mb-6">
              <svg className="w-28 h-28" viewBox="0 0 52 52">
                <circle
                  className="text-primary/20"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  className="text-primary animate-[stroke-draw_0.8s_ease-out_forwards]"
                  style={{ strokeDasharray: 157, strokeDashoffset: 157 }}
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                />
                <path
                  className="text-primary-foreground animate-[stroke-draw_0.5s_ease-out_0.8s_forwards]"
                  style={{ strokeDasharray: 50, strokeDashoffset: 50 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 27l8 8 16-16"
                />
              </svg>
            </div>

            {/* Text animation */}
            <h1 className="text-4xl font-headline font-bold text-foreground animate-[fade-in-up_0.5s_ease-out_1s_forwards] opacity-0">
              {coins && coins > 0 ? 'Welcome!' : 'Welcome Back!'}
            </h1>
            
            {coins && coins > 0 && (
              <div className="relative mt-4">
                 <p className="text-2xl font-semibold text-primary animate-[fade-in-up_0.5s_ease-out_1.2s_forwards] opacity-0">
                    Congratulations!
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xl text-muted-foreground animate-[fade-in-up_0.5s_ease-out_1.4s_forwards] opacity-0">
                  You've received
                  <div className="relative flex items-center justify-center gap-1 font-bold text-foreground">
                    
                    {/* Coin burst animation */}
                    {coinParticles.map((_, i) => (
                        <Sparkle
                            key={i}
                            className="absolute text-amber-400 animate-burst"
                            style={{
                                '--i': i,
                                animationDelay: '1.6s',
                            } as React.CSSProperties}
                        />
                    ))}

                    <div className="relative z-10 flex items-center gap-1">
                        <Coins className="w-6 h-6 text-amber-500 animate-bounce-short" style={{ animationDelay: '1.8s' }} />
                        {coins} Coins
                    </div>

                  </div>
                </div>
              </div>
            )}
            
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-8 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full animate-progress-smooth"
                style={{'--duration': '3s', animationDelay: '0.5s'} as React.CSSProperties}
              ></div>
            </div>
          </div>
      </DialogContent>

      <style jsx>{`
        @keyframes stroke-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fade-in-up {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
              opacity: 0;
              transform: translateY(20px);
          }
        }
        @keyframes progress-smooth {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-bounce-short {
            animation: bounce-short 1s ease-in-out infinite;
        }
        @keyframes bounce-short {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15%); }
        }
        .animate-burst {
            animation: burst 0.8s ease-out forwards;
        }
        @keyframes burst {
            0% {
                transform: scale(0.5) rotate(calc(var(--i) * 30deg));
                opacity: 1;
            }
            100% {
                transform: scale(2) rotate(calc(var(--i) * 30deg));
                opacity: 0;
            }
        }
      `}</style>
    </Dialog>
  );
}
