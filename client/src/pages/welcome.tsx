import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MicIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Use actual memoji assets from public/memojis
const memojiAvatars = [
  { src: "/memojis/464962e7-46d7-462f-8e4d-0815c5525cd1.jpeg", alt: "Black woman business owner 1" },
  { src: "/memojis/91baa2c5-2f1f-4784-93af-0d388f74a527.jpeg", alt: "Black man business owner 1" },
  { src: "/memojis/8dc1d9b0-fad0-4aa9-a6bd-f614fc4c3cd4.jpeg", alt: "Black woman business owner 2" },
  { src: "/memojis/Memoji iPhone Apple.jpeg", alt: "Black man business owner 2" },
];

// Use PNG icons from public/icons
const FinanceIcons = [
  {
    key: "accounting-report",
    img: <img src="/icons/Accounting.png" alt="Accounting Report Icon" className="w-14 h-14 object-contain" />,
  },
  {
    key: "calculator",
    img: <img src="/icons/Calculator.png" alt="Calculator Icon" className="w-14 h-14 object-contain" />,
  },
  {
    key: "receipt",
    img: <img src="/icons/Receipt.png" alt="Receipt Icon" className="w-14 h-14 object-contain" />,
  },
  {
    key: "cashier-machine",
    img: <img src="/icons/cashier-machine.png" alt="Cash Register Icon" className="w-14 h-14 object-contain" />,
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  // Animation step states
  const [showThe, setShowThe] = useState(false);
  const [showSimplest, setShowSimplest] = useState(false);
  const [showBookkeeper, setShowBookkeeper] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowThe(true), 100);
    setTimeout(() => setShowSimplest(true), 1100);
    setTimeout(() => setShowBookkeeper(true), 2000);
    setTimeout(() => setShowText(true), 2700);
    setTimeout(() => setShowButton(true), 3400);
  }, []);

  // Handler for CTA button
  const handleGetStarted = () => {
    // Check onboarding status (localStorage)
    const setupComplete = localStorage.getItem("setupComplete");
    if (setupComplete === "true") {
      navigate("/home");
    } else {
      navigate("/home"); // or navigate to onboarding if you have a route
    }
  };

  // Layout math
  const iconCount = FinanceIcons.length;
  const memojiCount = memojiAvatars.length;
  const orbitRadius = 140;
  const orbitCenter = 170;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#007556] transition-all duration-1000 px-4 sm:px-6 md:px-8">
      {/* Brand Title Section */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto mb-8">
        {/* THE (curved, animated) */}
        <svg width="200" height="60" viewBox="0 0 200 60" className="mb-[-10px] w-[150px] sm:w-[180px] md:w-[200px]">
          <path id="curve" d="M20,40 Q100,-20 180,40" fill="transparent" />
          <text x="122" y="45" textAnchor="middle" fill="#f8aec9" fontFamily="'Poppins', 'Montserrat', sans-serif" fontWeight="700" fontSize="28" letterSpacing="6" style={{dominantBaseline:'middle'}}>
            <textPath href="#curve" startOffset="-20%">
              <tspan className={showThe ? 'animate-theArcIn' : 'opacity-0'}>THE</tspan>
            </textPath>
          </text>
        </svg>
        {/* Simplest (script, animated) */}
        <span className={showSimplest ? 'animate-simplestBounce' : 'opacity-0'}
          style={{fontFamily: 'Pacifico, cursive', color: 'white', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, lineHeight: 1, letterSpacing: 1, display: 'block', textAlign: 'center'}}>
          Simplest
        </span>
        {/* BOOKKEEPER (sans-serif, animated) */}
        <span className={showBookkeeper ? 'animate-bookkeeperIn' : 'opacity-0'}
          style={{fontFamily: 'Poppins, Montserrat, sans-serif', color: 'white', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 700, letterSpacing: '0.3em', marginTop: '1.5rem', display: 'block', textAlign: 'center'}}>
          BOOKKEEPER
        </span>
      </div>

      {/* Video Section */}
      <div className="w-full max-w-4xl mx-auto mt-8 mb-4 flex justify-center">
        <img 
          src="/vids/Your-paragraph-text-1--unscreen.gif"
          alt="Welcome Demo"
          className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] object-contain rounded-lg"
        />
      </div>

      {/* Supporting Text and CTA Button */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-12 mt-4 px-4 sm:px-6 md:px-8">
        <p style={{fontFamily: 'Poppins, Montserrat, sans-serif', color: 'white', fontWeight: 400, fontSize: 'clamp(0.875rem, 2vw, 1rem)', lineHeight: '1.5', textAlign: 'center'}}>
          <span style={{fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', color: 'white', opacity: 0.8}}>No spreadsheets. No stress. Just speak.</span>
        </p>
        <div className="flex items-center">
          <Button 
            className="w-[280px] sm:w-[320px] md:w-80 h-12 sm:h-14 rounded-full flex items-center justify-center gap-3 bg-white text-[#007556] text-base sm:text-lg font-semibold shadow-lg transition-all duration-150 hover:shadow-2xl hover:scale-105 border-none" 
            onClick={handleGetStarted} 
            style={{boxShadow: '0 4px 24px 0 #0002'}}
          > 
            Let's Set You Up
          </Button>
          <img 
            src="/memojis/Memoji iPhone Apple.jpeg" 
            alt="Memoji" 
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white shadow-md -ml-4" 
          />
        </div>
      </div>

      {/* Keyframes and animation styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Pacifico&family=Poppins:wght@700&display=swap');
        @keyframes theArcIn {
          0% { opacity: 0; transform: translateY(-30px) scale(0.7); }
          30% { opacity: 0.7; transform: translateY(-15px) scale(0.85); }
          60% { opacity: 0.9; transform: translateY(-5px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-theArcIn {
          animation: theArcIn 1.5s cubic-bezier(.5,1.8,.5,1) forwards;
        }
        @keyframes simplestBounce {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-simplestBounce {
          animation: simplestBounce 0.8s cubic-bezier(.5,1.8,.5,1) forwards;
        }
        @keyframes bookkeeperIn {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-bookkeeperIn {
          animation: bookkeeperIn 0.7s cubic-bezier(.5,1.8,.5,1) forwards;
        }
      `}</style>
    </div>
  );
} 