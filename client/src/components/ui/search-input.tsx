import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({ 
  placeholder = "Search...", 
  onSearch, 
  debounceMs = 300,
  value: externalValue,
  onChange: externalOnChange
}: SearchInputProps) {
  const [internalQuery, setInternalQuery] = useState("");
  
  // Dışarıdan value verilmişse onu kullan, yoksa kendi state'ini kullan
  const query = externalValue !== undefined ? externalValue : internalQuery;
  const setQuery = externalOnChange || setInternalQuery;
  
  const debouncedOnSearch = useCallback(
    useDebounce((query: string) => {
      onSearch(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedOnSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
}


