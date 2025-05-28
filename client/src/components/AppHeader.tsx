import { useState, useEffect } from 'react';
import { SummarizeIcon, CalculatorIcon, LightModeIcon, DarkModeIcon } from "@/components/ui/icons";

interface AppHeaderProps {
  onSummaryClick?: () => void;
}

export default function AppHeader({ onSummaryClick }: AppHeaderProps) {
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
          <CalculatorIcon className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="font-light">The</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-foreground">Simplest Bookkeeper</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onSummaryClick && (
          <button
            className="text-white bg-white bg-opacity-10 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
            onClick={onSummaryClick}
            aria-label="Show summary"
          >
            <SummarizeIcon className="h-5 w-5" />
          </button>
        )}
        <button 
          onClick={toggleDarkMode} 
          className="text-white bg-white bg-opacity-10 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <LightModeIcon className="h-5 w-5" />
          ) : (
            <DarkModeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}
