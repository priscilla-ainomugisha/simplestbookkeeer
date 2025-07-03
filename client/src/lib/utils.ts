import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getFormattedDate(date: Date = new Date()): string {
  return `Today, ${getCurrentTime()}`;
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateFull(date: Date | string | undefined | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getCategoryIcon(category: string): string {
  const categoryMap: Record<string, string> = {
    "Sales": "payments",
    "Revenue": "payments",
    "Income": "payments",
    "Transport": "directions_car",
    "Food": "restaurant",
    "Supplies": "inventory_2",
    "Rent": "home",
    "Utilities": "electric_bolt",
    "Inventory": "inventory",
    "Salary": "people",
    "Marketing": "campaign",
    "Other": "more_horiz"
  };
  
  return categoryMap[category] || "receipt_long";
}
