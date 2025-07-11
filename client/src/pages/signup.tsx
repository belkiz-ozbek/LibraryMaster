import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, Loader2, User, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

// Password strength function
const getPasswordStrength = (password: string): string => {
  if (password.length === 0) return '';
  if (password.length < 6) return 'Zayıf';
  if (password.length < 8) return 'Orta';
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) return 'Güçlü';
  return 'Orta';
};

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
  const { t } = useTranslation();
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
      newErrors.firstName = t("auth.form.firstNameRequired");
    }
    if (!lastName.trim()) {
      newErrors.lastName = t("auth.form.lastNameRequired");
    }
    if (!username.trim()) {
      newErrors.username = t("auth.form.usernameRequired");
    } else if (username.length < 3) {
      newErrors.username = t("auth.form.usernameMinLength");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = t("auth.form.usernameFormat");
    }
    if (!email) {
      newErrors.email = t("auth.form.emailRequired");
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = t("auth.form.emailInvalid");
    }
    if (!password) {
      newErrors.password = t("auth.form.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("auth.form.passwordMinLength");
    }
    if (!password2) {
      newErrors.password2 = t("auth.form.confirmPasswordRequired");
    } else if (password !== password2) {
      newErrors.password2 = t("auth.form.passwordsDontMatch");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // Store user data temporarily in sessionStorage
      const userData = {
        name: `${firstName.trim()} ${lastName.trim()}`,
        username: username.trim(),
        email: email.trim(),
        password: password
      };
      sessionStorage.setItem('pendingUserData', JSON.stringify(userData));
      
      // Send verification email request
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      const data = await response.json();
      toast({
        title: t("auth.signupSuccess"),
        description: t("auth.signupSuccessDesc"),
      });
      
      // Navigate to verify email page with email parameter
      navigate(`/verify-email?email=${encodeURIComponent(email)}&pending=true`);
    } catch (error: any) {
      // Clear stored data on error
      sessionStorage.removeItem('pendingUserData');
      toast({
        title: t("auth.signupFailed"),
        description: error.message || t("auth.signupFailedDesc"),
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
  const passwordStrengthColor = passwordStrength === t("auth.form.passwordStrength.strong") ? 'text-green-600' : passwordStrength === t("auth.form.passwordStrength.medium") ? 'text-yellow-600' : passwordStrength === t("auth.form.passwordStrength.weak") ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-6 right-6 z-10"
      >
        <LanguageSwitcher />
      </motion.div>
      
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
                  {t("auth.signupDesc")}
                </CardDescription>
              </motion.div>
            </motion.div>
          </CardHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    {t("auth.form.firstName")}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      ref={firstNameRef}
                      id="firstName"
                      type="text"
                      placeholder={t("auth.form.firstName")}
                      value={firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`pl-10 ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  {errors.firstName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600"
                    >
                      {errors.firstName}
                    </motion.p>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    {t("auth.form.lastName")}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      ref={lastNameRef}
                      id="lastName"
                      type="text"
                      placeholder={t("auth.form.lastName")}
                      value={lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`pl-10 ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  {errors.lastName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600"
                    >
                      {errors.lastName}
                    </motion.p>
                  )}
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  {t("auth.form.username")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={usernameRef}
                    id="username"
                    type="text"
                    placeholder={t("auth.form.username")}
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`pl-10 ${errors.username ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                {errors.username && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t("auth.form.email")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder={t("auth.form.email")}
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t("auth.form.password")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.form.password")}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 mt-1"
                  >
                    <div className={`flex items-center space-x-1 ${passwordStrengthColor}`}>
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">{passwordStrength}</span>
                    </div>
                  </motion.div>
                )}
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Label htmlFor="password2" className="text-sm font-medium text-gray-700">
                  {t("auth.form.confirmPassword")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={password2Ref}
                    id="password2"
                    type={showPassword2 ? "text" : "password"}
                    placeholder={t("auth.form.confirmPassword")}
                    value={password2}
                    onChange={(e) => handleInputChange('password2', e.target.value)}
                    className={`pl-10 pr-10 ${errors.password2 ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword2 ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {errors.password2 && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600"
                  >
                    {errors.password2}
                  </motion.p>
                )}
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="flex flex-col space-y-3 w-full">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    variant="gradient"
                    size="xl"
                    className="w-full font-semibold shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center"
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.signupProcessing")}
                      </motion.div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {t("auth.signup")}
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
                  {t("auth.alreadyHaveAccount")}{" "}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 underline underline-offset-2 hover:underline-offset-4"
                    disabled={isLoading}
                  >
                    {t("auth.goToLogin")}
                  </motion.button>
                </motion.p>
              </div>
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