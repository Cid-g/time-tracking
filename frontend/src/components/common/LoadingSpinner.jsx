const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="flex flex-col items-center gap-4">
        {/* Dual ring spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-[3px] border-cyan-500/15 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-transparent border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
          <div className="absolute inset-1.5 border-[2px] border-transparent border-b-purple-400/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
        </div>
        <span className="text-[12px] text-white/20 font-medium tracking-wider uppercase">Loading</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
