import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onSummaryClick: () => void;
}

export default function Header({ onSummaryClick }: HeaderProps) {
  return (
    <header className="bg-white py-3 px-4 flex items-center justify-between sticky top-0 z-10 border-b border-border">
      <div className="flex items-center">
        <h1 className="text-foreground text-xl font-medium mr-8">dfp.co</h1>
        <span className="font-medium text-sm text-gray-800">Overview</span>
      </div>
      
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 bg-secondary border-none"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-muted-foreground hover:text-foreground">
          <Bell size={18} />
        </button>
        <button className="text-muted-foreground hover:text-foreground">
          <Settings size={18} />
        </button>
        <button
          className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white"
          onClick={onSummaryClick}
        >
          <span className="text-xs font-medium">AB</span>
        </button>
      </div>
    </header>
  );
}
