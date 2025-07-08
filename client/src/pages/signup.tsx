import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function getPasswordStrength(password: string) {
  if (!password) return '';
  if (password.length < 6) return 'Zayıf';
  if (/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(password)) return 'Güçlü';
  if (password.length >= 8) return 'Orta';
  return 'Zayıf';
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; username?: string; email?: string; password?: string; password2?: string }>({});
  const [touched, setTouched] = useState<{ firstName?: boolean; lastName?: boolean; username?: boolean; email?: boolean; password?: boolean; password2?: boolean }>({});
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { signup } = useAuth();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const password2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors.firstName && firstNameRef.current) firstNameRef.current.focus();
    else if (errors.lastName && lastNameRef.current) lastNameRef.current.focus();
    else if (errors.username && usernameRef.current) usernameRef.current.focus();
    else if (errors.email && emailRef.current) emailRef.current.focus();
    else if (errors.password && passwordRef.current) passwordRef.current.focus();
    else if (errors.password2 && password2Ref.current) password2Ref.current.focus();
  }, [errors]);

  const validateForm = () => {
    const newErrors: { firstName?: string; lastName?: string; username?: string; email?: string; password?: string; password2?: string } = {};
    if (!firstName.trim()) {
      newErrors.firstName = "İsim zorunlu";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Soyad zorunlu";
    }
    if (!username.trim()) {
      newErrors.username = "Kullanıcı adı zorunlu";
    } else if (username.length < 3) {
      newErrors.username = "Kullanıcı adı en az 3 karakter olmalı";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir";
    }
    if (!email) {
      newErrors.email = "E-posta zorunlu";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }
    if (!password) {
      newErrors.password = "Şifre zorunlu";
    } else if (password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalı";
    }
    if (!password2) {
      newErrors.password2 = "Şifre tekrarı zorunlu";
    } else if (password !== password2) {
      newErrors.password2 = "Şifreler eşleşmiyor";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signup(`${firstName.trim()} ${lastName.trim()}`, username.trim(), email.trim(), password);
      toast({
        title: "Kayıt başarılı!",
        description: "Lütfen e-posta adresinizi doğrulamak için e-postanızı kontrol edin.",
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast({
        title: "Kayıt başarısız",
        description: error.message || "Kayıt sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'firstName' | 'lastName' | 'username' | 'email' | 'password' | 'password2', value: string) => {
    if (field === 'firstName') setFirstName(value);
    if (field === 'lastName') setLastName(value);
    if (field === 'username') setUsername(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'password2') setPassword2(value);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthColor = passwordStrength === 'Güçlü' ? 'text-green-600' : passwordStrength === 'Orta' ? 'text-yellow-600' : passwordStrength === 'Zayıf' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
      
      <div className="w-full max-w-md mx-auto">
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-4 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center space-y-3"
            >
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
                />
              </motion.div>
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
                  Güvenli ve hızlı kayıt olun, kitap dünyasına adım atın.
                </CardDescription>
              </motion.div>
            </motion.div>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <CardContent className="space-y-4">
              {/* Name fields in two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Label htmlFor="firstName" className="text-xs font-medium text-gray-500">
                    İsim
                  </Label>
                  <div className="relative group">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                    </motion.div>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="İsminizi girin"
                      value={firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`pl-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${errors.firstName ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
                      disabled={isLoading}
                      ref={firstNameRef}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      autoComplete="given-name"
                    />
                    {errors.firstName && (
                      <motion.div 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <User className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  {errors.firstName && (
                    <motion.p 
                      className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                      id="firstName-error" 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.firstName}
                    </motion.p>
                  )}
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <Label htmlFor="lastName" className="text-xs font-medium text-gray-500">
                    Soyad
                  </Label>
                  <div className="relative group">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.25 }}
                    >
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                    </motion.div>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Soyadınızı girin"
                      value={lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`pl-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${errors.lastName ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
                      disabled={isLoading}
                      ref={lastNameRef}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      autoComplete="family-name"
                    />
                    {errors.lastName && (
                      <motion.div 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <User className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  {errors.lastName && (
                    <motion.p 
                      className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                      id="lastName-error" 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.lastName}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Username field */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                className="space-y-1.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Label htmlFor="username" className="text-xs font-medium text-gray-500">
                  Kullanıcı Adı
                </Label>
                <div className="relative group">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                  </motion.div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`pl-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${errors.username ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
                    disabled={isLoading}
                    ref={usernameRef}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <motion.div 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <User className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                {errors.username && (
                  <motion.p 
                    className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                    id="username-error" 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {errors.username}
                  </motion.p>
                )}
              </motion.div>

              {/* Email field */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                className="space-y-1.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <Label htmlFor="email" className="text-xs font-medium text-gray-500">
                  E-posta
                </Label>
                <div className="relative group">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                  >
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                  </motion.div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-posta adresinizi girin"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${errors.email ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
                    disabled={isLoading}
                    ref={emailRef}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <motion.div 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Mail className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                {errors.email && (
                  <motion.p 
                    className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                    id="email-error" 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              {/* Password fields side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Label htmlFor="password" className="text-xs font-medium text-gray-500">
                    Şifre
                  </Label>
                  <div className="relative group">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                    </motion.div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 pr-10 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 border-2 ${errors.password ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300 border-gray-200'}`}
                      disabled={isLoading}
                      ref={passwordRef}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      autoComplete="new-password"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-200"
                      disabled={isLoading}
                      tabIndex={-1}
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Şifreyi göster/gizle</span>
                    </motion.button>
                    {errors.password && (
                      <motion.div 
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Lock className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  {errors.password && (
                    <motion.p 
                      className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                      id="password-error" 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.password}
                    </motion.p>
                  )}
                  {password && (
                    <motion.div 
                      className="flex items-center space-x-2 text-xs"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-gray-500">Güçlük:</span>
                      <span className={`font-medium ${passwordStrengthColor}`}>
                        {passwordStrength}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileFocus={{ scale: 1.03, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="password2" className="text-xs font-medium text-gray-500">
                    Şifre Tekrar
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-blue-500 group-hover:text-blue-400" />
                    <Input
                      id="password2"
                      type={showPassword2 ? "text" : "password"}
                      placeholder="Şifrenizi tekrar girin"
                      value={password2}
                      onChange={(e) => handleInputChange('password2', e.target.value)}
                      className={`pl-10 pr-14 h-10 rounded-lg transition-all duration-300 focus:shadow-lg hover:shadow-md text-sm placeholder:text-gray-400 ${errors.password2 ? 'border-red-500 focus:border-red-500 ring-2 ring-red-300' : 'focus:border-blue-500 ring-1 ring-blue-100 hover:border-blue-300'}`}
                      disabled={isLoading}
                      ref={password2Ref}
                      aria-invalid={!!errors.password2}
                      aria-describedby={errors.password2 ? 'password2-error' : undefined}
                      autoComplete="new-password"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-200"
                      disabled={isLoading}
                      tabIndex={-1}
                      aria-label={showPassword2 ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Şifreyi göster/gizle</span>
                    </motion.button>
                    {errors.password2 && (
                      <Lock className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-400 h-4 w-4 animate-shake" />
                    )}
                  </div>
                  {errors.password2 && (
                    <motion.p 
                      className="text-red-400 text-xs animate-in slide-in-from-top-1" 
                      id="password2-error" 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.password2}
                    </motion.p>
                  )}
                </motion.div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="flex flex-col space-y-3 w-full">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center"
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kayıt olunuyor...
                      </motion.div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Kayıt Ol
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </div>
              <div className="text-center">
                <motion.p 
                  className="text-sm text-gray-600" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Zaten hesabınız var mı?{" "}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 underline underline-offset-2 hover:underline-offset-4"
                    disabled={isLoading}
                  >
                    Giriş yapın
                  </motion.button>
                </motion.p>
              </div>
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