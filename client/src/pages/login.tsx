import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Lock, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

// Types
interface FormErrors {
  identifier?: string;
  password?: string;
}

// Form Field Component
interface FormFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, type, placeholder, value, onChange, error, icon, showPasswordToggle, showPassword, onTogglePassword }, ref) => (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase()} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input
          ref={ref}
          id={label.toLowerCase()}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 pr-10 ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
);

FormField.displayName = "FormField";

// Video Background Component
const VideoBackground = () => (
  <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
    <video
      src="/video.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-black/40"></div>
    <motion.div 
      className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"
      animate={{ 
        background: [
          "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)",
          "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
          "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)"
        ]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

const LogoSection = () => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
    className="flex items-center space-x-4"
  >
    <motion.img 
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      src="/ahdevefa-logo.png" 
      alt="Ahdevefa Logo" 
      className="h-12 w-auto object-contain"
      loading="lazy"
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.6 }}
      className="w-px h-8 bg-gray-300"
    ></motion.div>
    <motion.img 
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      src="/yetim-vakfi-logo.png" 
      alt="Yetim Vakfi Logo" 
      className="h-12 w-auto object-contain"
      loading="lazy"
    />
  </motion.div>
);

const TitleSection = () => {
  const { t } = useTranslation();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="text-center space-y-1"
    >
      <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        {t("auth.systemTitle")}
      </CardTitle>
      <motion.div 
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="h-1 w-16 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-1"
      ></motion.div>
      <CardDescription className="text-gray-700 text-base font-medium">
        {t("auth.loginDesc")}
      </CardDescription>
    </motion.div>
  );
};

const SubmitButton = ({ isLoading, onSubmit }: { isLoading: boolean; onSubmit: (e: React.FormEvent) => void }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl relative overflow-hidden group"
        disabled={isLoading}
        onClick={onSubmit}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center relative z-10"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loading.signingIn")}
          </motion.div>
        ) : (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10"
          >
            {t("auth.signIn")}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
};

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const { t } = useTranslation();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors.identifier && identifierRef.current) identifierRef.current.focus();
    else if (errors.password && passwordRef.current) passwordRef.current.focus();
  }, [errors]);

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = t("auth.form.identifierRequired");
    }
    if (!password) {
      newErrors.password = t("auth.form.passwordRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [identifier, password, t]);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate("/");
    } catch (error: any) {
      toast({
        title: t("auth.loginFailed"),
        description: error.message || t("auth.invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, validateForm, login, navigate, toast, t]);

  // Memoized input change handler
  const handleInputChange = useCallback((field: 'identifier' | 'password', value: string) => {
    if (field === 'identifier') setIdentifier(value);
    if (field === 'password') setPassword(value);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  // Memoized password toggle handler
  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Memoized navigation handler
  const handleSignupClick = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <VideoBackground />
      
      {/* Language Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-6 right-6 z-10"
      >
        <LanguageSwitcher />
      </motion.div>
      
      <div className="w-full max-w-md mx-auto">
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-4 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center space-y-3"
            >
              <LogoSection />
              <TitleSection />
            </motion.div>
          </CardHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <FormField
                  label={t("auth.form.identifier")}
                  type="text"
                  placeholder={t("auth.form.identifier")}
                  value={identifier}
                  onChange={(value) => handleInputChange('identifier', value)}
                  error={errors.identifier}
                  ref={identifierRef}
                  icon={<User className="h-4 w-4" />}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <FormField
                  label={t("auth.form.password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.form.password")}
                  value={password}
                  onChange={(value) => handleInputChange('password', value)}
                  error={errors.password}
                  ref={passwordRef}
                  icon={<Lock className="h-4 w-4" />}
                  showPasswordToggle={true}
                  showPassword={showPassword}
                  onTogglePassword={togglePassword}
                />
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="flex flex-col space-y-3 w-full">
                <SubmitButton isLoading={isLoading} onSubmit={handleSubmit} />
              </div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.p 
                  className="text-sm text-gray-600" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t("auth.dontHaveAccount")}{" "}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSignupClick}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 underline underline-offset-2 hover:underline-offset-4"
                    disabled={isLoading}
                  >
                    {t("auth.goToSignup")}
                  </motion.button>
                </motion.p>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 {t("auth.systemTitle")}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 