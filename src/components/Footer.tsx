export function Footer() {
  return (
    <footer className="hidden h-9 bg-gradient-to-r from-white via-[#F8FAFC] to-white border-t border-[#E5E7EB]/50 px-4 flex items-center justify-between text-[10px] text-[#6B7280] flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div>
          Developed by{' '}
          <a
            href="https://innpact.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
          >
            Innpact Solutions
          </a>
        </div>
        <div className="h-2.5 w-px bg-[#E5E7EB]" />
        <div>Powered by GIZ</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded text-[9px] font-medium">{import.meta.env.VITE_APP_VERSION ?? 'dev'}</span>
        <span>© 2025</span>
      </div>
    </footer>
  );
}