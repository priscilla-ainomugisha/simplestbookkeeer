import { SummarizeIcon } from "@/components/ui/icons";

interface HeaderProps {
  onSummaryClick: () => void;
}

export default function Header({ onSummaryClick }: HeaderProps) {
  return (
    <header className="bg-black py-3 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <h1 className="text-white text-sm font-normal tracking-widest uppercase">Bookkeeper</h1>
      </div>
      <button
        className="text-white flex items-center"
        onClick={onSummaryClick}
        aria-label="Show summary"
      >
        <SummarizeIcon className="h-5 w-5" />
      </button>
    </header>
  );
}
