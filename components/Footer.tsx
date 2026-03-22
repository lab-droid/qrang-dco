import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-4 left-6 z-50">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-light tracking-widest opacity-60 hover:opacity-100 transition-opacity">
        <span className="w-2 h-2 bg-curang-primary rounded-full animate-pulse"></span>
        DEVELOPER <span className="text-curang-primary font-bold">정혁신</span>
      </div>
    </footer>
  );
};

export default Footer;