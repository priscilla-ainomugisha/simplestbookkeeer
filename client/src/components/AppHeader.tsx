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
    <header className="bg-primary fixed top-0 left-0 right-0 z-10 shadow-md h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        <span className="material-icons text-white mr-2">account_balance_wallet</span>
        <h1 className="text-xl font-medium text-white">The Simplest Bookkeeper</h1>
      </div>
      <div className="flex items-center">
        <button onClick={toggleDarkMode} className="text-white p-2 rounded-full hover:bg-primary-dark">
          <span className={`material-icons ${isDarkMode ? 'hidden' : ''}`}>dark_mode</span>
          <span className={`material-icons ${isDarkMode ? '' : 'hidden'}`}>light_mode</span>
        </button>
      </div>
    </header>
  );
}
