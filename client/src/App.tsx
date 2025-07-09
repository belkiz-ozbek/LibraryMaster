import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import Books from "./pages/books";
import Members from "./pages/members";
import MemberDetails from "./pages/member-details";
import Borrowing from "./pages/borrowing";
import Returns from "./pages/returns";
import Evaluations from "./pages/evaluations";
import Statistics from "./pages/statistics";
import Activities from "./pages/activities";
import NotFound from "./pages/not-found";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import VerifyEmailPage from "./pages/verify-email";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "./hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Loading Screen Component
function LoadingScreen() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center mb-6"
        >
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ 
              y: [0, -10, 0],
              opacity: 1,
              rotate: [-8, 8, -8],
            }}
            transition={{ 
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              initial: { duration: 1.5, ease: "easeOut" }
            }}
            className="mb-0"
          >
            <motion.img 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              src="/ahdevefa-logo.png" 
              alt="Ahdevefa Logo" 
              className="h-32 w-auto object-contain"
              loading="lazy"
            />
          </motion.div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          LibraryMS
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-gray-600 mb-6"
        >
          {t("loading.loading")}
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="flex items-center justify-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-blue-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome to LibraryMS",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book text-white text-xl"></i>
          </div>
          <CardTitle className="text-2xl">LibraryMS</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@library.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  // Only show loading screen if we're actually checking authentication
  // and we don't have a user yet
  if (isLoading && !user) {
    return <LoadingScreen />;
  }
  
  // If not authenticated, show auth pages
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  // If authenticated, show main app
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/books" component={Books} />
        <Route path="/members" component={Members} />
        <Route path="/members/:id" component={MemberDetails} />
        <Route path="/borrowing" component={Borrowing} />
        <Route path="/returns" component={Returns} />
        <Route path="/evaluations" component={Evaluations} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/activities" component={Activities} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
