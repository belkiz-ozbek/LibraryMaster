import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";

// Types
interface FormErrors {
  identifier?: string;
  password?: string;
}

interface InputFieldProps {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
  ref: React.RefObject<HTMLInputElement>;
  autoComplete: string;
  icon: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

// Extracted Components
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

const TitleSection = () => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.7 }}
    className="text-center space-y-1"
  >
    <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
      Kütüphane Yönetim Sistemi
    </CardTitle>
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay: 0.8 }}
      className="h-1 w-16 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-1"
    ></motion.div>
    <CardDescription className="text-gray-700 text-base font-medium">
      Hesabınıza giriş yapın ve kitap dünyasına erişin.
    </CardDescription>
  </motion.div>
);

const InputField = ({ 
  id, 
  type, 
  placeholder, 
  value, 
  onChange, 
  error, 
  disabled, 
  ref, 
  autoComplete, 
  icon, 
  showPasswordToggle, 
  showPassword, 
  onTogglePassword 
}: InputFieldProps) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -2 }}
    whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
    className="space-y-2"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <Label htmlFor={id} className="text-xs font-medium text-gray-500">
      {placeholder}
    </Label>
    <div className="relative group">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {icon}
      </motion.div>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${error ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
        disabled={disabled}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
      />
      {showPasswordToggle && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-200"
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">Şifreyi göster/gizle</span>
        </motion.button>
      )}
      {error && (
        <motion.div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {type === "password" ? <Lock className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </motion.div>
      )}
    </div>
    {error && (
      <motion.p 
        className="text-red-400 text-xs animate-in slide-in-from-top-1" 
        id={`${id}-error`} 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.p>
    )}
  </motion.div>
);

const SubmitButton = ({ isLoading, onSubmit }: { isLoading: boolean; onSubmit: (e: React.FormEvent) => void }) => (
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
          Giriş yapılıyor...
        </motion.div>
      ) : (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          Giriş Yap
        </motion.span>
      )}
    </Button>
  </motion.div>
);

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
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
      newErrors.identifier = "Kullanıcı adı veya e-posta zorunlu";
    }
    if (!password) {
      newErrors.password = "Şifre zorunlu";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [identifier, password]);

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
        title: "Giriş başarısız",
        description: error.message || "Giriş sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, validateForm, login, navigate, toast]);

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
          
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <CardContent className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <InputField
                  id="identifier"
                  type="text"
                  placeholder="Kullanıcı adı veya e-posta"
                  value={identifier}
                  onChange={(value) => handleInputChange('identifier', value)}
                  error={errors.identifier}
                  disabled={isLoading}
                  ref={identifierRef}
                  autoComplete="username"
                  icon={<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <InputField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(value) => handleInputChange('password', value)}
                  error={errors.password}
                  disabled={isLoading}
                  ref={passwordRef}
                  autoComplete="current-password"
                  icon={<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />}
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
                  Hesabınız yok mu?{" "}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSignupClick}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 underline underline-offset-2 hover:underline-offset-4"
                    disabled={isLoading}
                  >
                    Kayıt olun
                  </motion.button>
                </motion.p>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Kütüphane Yönetim Sistemi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 