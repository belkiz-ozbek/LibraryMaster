import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Save language preference to localStorage
    localStorage.setItem("preferredLanguage", languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className="h-12 px-3 py-2 bg-transparent border-0 hover:bg-transparent shadow-none hover:shadow-none transition-all duration-300"
        >
                      <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-1"
            >
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 uppercase">
                {currentLanguage.code}
              </span>
            </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`cursor-pointer p-2 rounded-md transition-all duration-200 ${
              i18n.language === language.code 
                ? "bg-blue-100 text-blue-700" 
                : "hover:bg-gray-50"
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2 w-full"
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
              {i18n.language === language.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                </motion.div>
              )}
            </motion.div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 