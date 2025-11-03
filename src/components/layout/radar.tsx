
'use client';

export default function Radar() {
  return (
    <div className="relative w-5 h-5">
      <div className="absolute inset-0 border-2 border-primary/50 rounded-full animate-ping-slow"></div>
      <div className="absolute inset-1 border border-primary/50 rounded-full"></div>
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute top-1/2 left-0 h-[1px] w-1/2 bg-primary animate-radar-sweep origin-right"></div>
      </div>
    </div>
  );
}
