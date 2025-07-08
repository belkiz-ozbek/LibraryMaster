import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeWords(str: string) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toLocaleUpperCase('tr-TR') + txt.slice(1).toLocaleLowerCase('tr-TR')
  );
}
