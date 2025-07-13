import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
// Eğer react-confetti yüklü ise aşağıdaki satırı açabilirsin:
// import Confetti from "react-confetti";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isPendingRegistration, setIsPendingRegistration] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        setIsLoading(true);
        setToken(tokenParam);
        try {
          const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenParam })
          });
          const data = await response.json();
          if (response.ok) {
            setIsVerified(true);
            setError(null);
            sessionStorage.removeItem('pendingUserData');
            toast({
              title: t("verifyEmail.successTitle"),
              description: t("verifyEmail.successDesc"),
            });
          } else {
            setIsVerified(false);
            setError(data.message || t("verifyEmail.errorGeneric"));
            sessionStorage.removeItem('pendingUserData');
          }
        } catch (err) {
          setIsVerified(false);
          setError(t("verifyEmail.errorServerError"));
        }
        setIsLoading(false);
        return;
      }
      
      const successParam = urlParams.get('success');
      const errorParam = urlParams.get('error');
      const emailParam = urlParams.get('email');
      const pendingParam = urlParams.get('pending');
      
      if (emailParam) setEmail(emailParam);
      
      // Check if this is a pending registration
      if (pendingParam === 'true') {
        setIsPendingRegistration(true);
        setIsLoading(false);
        return;
      }
      
      if (successParam === null) {
        setIsLoading(false);
        return;
      }

      if (successParam === '1') {
        setIsVerified(true);
        // Clear any pending user data since registration is complete
        sessionStorage.removeItem('pendingUserData');
        toast({
          title: t("verifyEmail.successTitle"),
          description: t("verifyEmail.successDesc"),
        });
      } else {
        let errorMessage = t("verifyEmail.errorGeneric");
        if (errorParam === 'invalid_token') {
          errorMessage = t("verifyEmail.errorInvalidToken");
        } else if (errorParam === 'token_expired') {
          errorMessage = t("verifyEmail.errorTokenExpired");
        } else if (errorParam === 'server_error') {
          errorMessage = t("verifyEmail.errorServerError");
        }
        setError(errorMessage);
        // Clear pending data on error
        sessionStorage.removeItem('pendingUserData');
      }
      setIsLoading(false);
    };
    verifyEmail();
  }, [toast, t]);

  // Başarı durumunda otomatik yönlendirme
  useEffect(() => {
    if (isVerified) {
      const timeout = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isVerified, navigate]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: t("verifyEmail.emailNotFound"),
        description: t("verifyEmail.emailNotFoundDesc"),
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: t("verifyEmail.resendEmailSuccess"),
          description: t("verifyEmail.resendEmailSuccessDesc"),
        });
      } else {
        toast({
          title: t("verifyEmail.resendEmailFailed"),
          description: data.message || t("verifyEmail.resendEmailFailedDesc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("verifyEmail.resendEmailFailed"),
        description: t("verifyEmail.resendEmailFailedDesc"),
        variant: "destructive",
      });
    }
  };

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
                  {t("auth.systemTitle")}
                </CardTitle>
                <motion.div 
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  className="h-1 w-16 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-1"
                ></motion.div>
                <CardDescription className="text-gray-700 text-base font-medium">
                  {t("auth.verifyEmailDesc")}
                </CardDescription>
              </motion.div>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" className="flex flex-col items-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-14 w-14 text-blue-600" />
                  </motion.div>
                  <motion.p 
                    className="text-gray-600 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t("loading.verifyingEmail")}
                  </motion.p>
                </motion.div>
              ) : isVerified ? (
                <motion.div key="success" className="flex flex-col items-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="h-24 w-24 text-green-500" />
                  </motion.div>
                  <motion.div 
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-2xl font-bold text-green-700">{t("verifyEmail.success")}</h3>
                    <p className="text-lg text-gray-800 font-semibold">{t("verifyEmail.successTitle")}</p>
                    <p className="text-gray-600">{t("verifyEmail.successDesc")}</p>
                    <motion.p 
                      className="text-sm text-gray-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {t("verifyEmail.redirecting")}
                    </motion.p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      onClick={handleGoToLogin} 
                      variant="gradient"
                      size="xl"
                      className="w-full font-semibold relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative z-10">{t("auth.loginImmediately")}</span>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : error ? (
                <motion.div key="error" className="flex flex-col items-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  >
                    <XCircle className="h-16 w-16 text-red-500" />
                  </motion.div>
                  <motion.div 
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xl font-bold text-red-700">{t("verifyEmail.error")}</h3>
                    <p className="text-gray-600">{error || t("verifyEmail.errorTitle")}</p>
                  </motion.div>
                  <div className="flex flex-col space-y-3 w-full">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                        {t("auth.goToLoginPage")}
                      </Button>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button onClick={handleResendEmail} variant="ghost" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        {t("verifyEmail.resendEmail")}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : isPendingRegistration ? (
                <motion.div key="pending" className="flex flex-col items-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Mail className="h-16 w-16 text-blue-500" />
                  </motion.div>
                  <motion.div 
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{t("verifyEmail.checkEmail")}</h3>
                    <p className="text-gray-600 text-sm">
                      {email ? `${t("verifyEmail.checkEmailDesc")} ${email}` : t("verifyEmail.checkEmailDesc")}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {t("verifyEmail.checkSpam")}
                    </p>
                  </motion.div>
                  <div className="flex flex-col space-y-3 w-full">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button onClick={handleResendEmail} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        <Mail className="mr-2 h-4 w-4" />
                        {t("verifyEmail.resendEmail")}
                      </Button>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                        {t("auth.goToLoginPage")}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="info" className="flex flex-col items-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Mail className="h-16 w-16 text-blue-500" />
                  </motion.div>
                  <motion.div 
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{t("verifyEmail.emailRequired")}</h3>
                    <p className="text-gray-600 text-sm">{t("verifyEmail.emailRequiredDesc")}</p>
                  </motion.div>
                  <div className="flex flex-col space-y-3 w-full">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button 
                        type="button"
                        onClick={handleResendEmail}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl relative overflow-hidden group"
                        disabled={isLoading}
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
                            {t("verifyEmail.resendEmailSending")}
                          </motion.div>
                        ) : (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative z-10"
                          >
                            {t("verifyEmail.resendEmail")}
                          </motion.span>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
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
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
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