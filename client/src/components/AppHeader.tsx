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
    <header className="bg-gradient-to-r from-primary to-primary/90 fixed top-0 left-0 right-0 z-10 shadow-lg h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-full w-10 h-10 mr-3">
          <span className="material-icons text-white">account_balance_wallet</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="font-light">The</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-foreground">Simplest Bookkeeper</span>
        </h1>
      </div>
      <div className="flex items-center">
        <button 
          onClick={toggleDarkMode} 
          className="text-white bg-white bg-opacity-10 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className={`material-icons ${isDarkMode ? 'hidden' : ''}`}>dark_mode</span>
          <span className={`material-icons ${isDarkMode ? '' : 'hidden'}`}>light_mode</span>
        </button>
      </div>
    </header>
  );
}
