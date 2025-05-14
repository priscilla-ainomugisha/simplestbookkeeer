import { useState, useEffect } from 'react';

export default function AppHeader() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for saved dark mode preference on initial load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark-mode') === 'true';
    setIsDarkMode(savedDarkMode);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dark-mode', newDarkMode ? 'true' : 'false');
  };

  return (
    <header className="bg-primary fixed top-0 left-0 right-0 z-10 shadow-lg h-16 flex items-center justify-between px-4 border-b-4 border-secondary dark:border-accent">
      <div className="flex items-center">
        <div className="flex items-center justify-center bg-white border-2 border-black w-10 h-10 mr-3" style={{ transform: 'rotate(-5deg)' }}>
          <span className="material-icons text-black">payments</span>
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight uppercase" style={{ textShadow: '2px 2px 0px #000' }}>
          <span className="text-white font-pixel">THE</span> <span className="text-accent-foreground" style={{ letterSpacing: '1px' }}>SIMPLEST BOOKKEEPER</span>
        </h1>
      </div>
      
      <div className="flex items-center">
        <button 
          onClick={toggleDarkMode} 
          className="text-white bg-secondary border-2 border-black p-1.5 hover:bg-secondary-foreground transition-colors duration-200"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{ transform: 'skew(-5deg)' }}
        >
          <span className={`material-icons ${isDarkMode ? 'hidden' : ''}`}>dark_mode</span>
          <span className={`material-icons ${isDarkMode ? '' : 'hidden'}`}>light_mode</span>
        </button>
      </div>
      
      {/* Retro decorative elements */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden h-1" style={{ zIndex: 1 }}>
        <div className="h-full w-full bg-yellow-300" style={{ clipPath: 'polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0)' }}></div>
      </div>
    </header>
  );
}
