import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  History, 
  MessagesSquare,
  Users, 
  Settings 
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white border-r border-border h-screen fixed left-0 top-0 w-16 pt-16 flex flex-col items-center">
      <div className="mt-6 flex flex-col items-center space-y-6">
        <NavButton 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          isActive={false}
          onClick={() => {}} 
        />
        
        <NavButton 
          icon={<Wallet size={20} />} 
          label="Portfolio" 
          isActive={activeTab === "stats"}
          onClick={() => onTabChange("stats")} 
        />
        
        <NavButton 
          icon={<LineChart size={20} />} 
          label="Analytics" 
          isActive={false}
          onClick={() => {}} 
        />
        
        <NavButton 
          icon={<History size={20} />} 
          label="History" 
          isActive={activeTab === "history"}
          onClick={() => onTabChange("history")} 
        />
        
        <NavButton 
          icon={<MessagesSquare size={20} />} 
          label="Chat" 
          isActive={activeTab === "chat"}
          onClick={() => onTabChange("chat")} 
        />
        
        <NavButton 
          icon={<Users size={20} />} 
          label="Users" 
          isActive={false}
          onClick={() => {}} 
        />
        
        <NavButton 
          icon={<Settings size={20} />} 
          label="Settings" 
          isActive={false}
          onClick={() => {}} 
        />
      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
