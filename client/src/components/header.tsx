import { SummarizeIcon } from "@/components/ui/icons";

interface HeaderProps {
  onSummaryClick: () => void;
}

export default function Header({ onSummaryClick }: HeaderProps) {
  return (
    <header className="bg-[hsl(var(--secondary))] py-2 px-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
      <div className="flex items-center">
        <h1 className="text-white text-xl font-medium ml-2">The Simplest Bookkeeper</h1>
      </div>
      <button
        className="text-white flex items-center"
        onClick={onSummaryClick}
        aria-label="Show summary"
      >
        <SummarizeIcon className="h-6 w-6" />
      </button>
    </header>
  );
}
