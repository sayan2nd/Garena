
'use client';

import SecondCardDecoration from './second-card-decoration';

interface SecondCardWrapperProps {
  children: React.ReactNode;
  index: number;
}

export default function SecondCardWrapper({ children, index }: SecondCardWrapperProps) {
  // Card numbers 26, 27, 28, 29, 30, 31 correspond to 0-based indices 25, 26, 27, 28, 29, 30
  const targetIndices = [19, 20, 21, 22, 23, 24];

  if (targetIndices.includes(index)) {
    return (
      <div className="relative">
        <SecondCardDecoration />
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
