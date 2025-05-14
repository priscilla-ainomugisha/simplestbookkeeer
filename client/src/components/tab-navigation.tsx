import { MessageSquareIcon, HistoryIcon, BarChart3Icon } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white shadow-sm">
      <div className="flex justify-around">
        <button
          className={`py-3 flex-1 text-center ${
            activeTab === "chat"
              ? "text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))] font-medium"
              : "text-gray-500"
          }`}
          onClick={() => onTabChange("chat")}
          aria-label="Chat"
        >
          <MessageSquareIcon className="block mx-auto h-5 w-5 mb-1" />
          Chat
        </button>
        <button
          className={`py-3 flex-1 text-center ${
            activeTab === "history"
              ? "text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))] font-medium"
              : "text-gray-500"
          }`}
          onClick={() => onTabChange("history")}
          aria-label="History"
        >
          <HistoryIcon className="block mx-auto h-5 w-5 mb-1" />
          History
        </button>
        <button
          className={`py-3 flex-1 text-center ${
            activeTab === "stats"
              ? "text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))] font-medium"
              : "text-gray-500"
          }`}
          onClick={() => onTabChange("stats")}
          aria-label="Stats"
        >
          <BarChart3Icon className="block mx-auto h-5 w-5 mb-1" />
          Stats
        </button>
      </div>
    </div>
  );
}
