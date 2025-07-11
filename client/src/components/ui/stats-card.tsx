import { Card } from "@/components/ui/card";
import { ReactNode, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  iconColor = "bg-primary/10 text-primary" 
}: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (typeof value === 'number') {
      const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    } else {
      setDisplayValue(Number(value) || 0);
    }
  }, [value, count]);

  useEffect(() => {
    if (typeof value === 'number') {
      const unsubscribe = rounded.on("change", (latest) => {
        setDisplayValue(latest);
      });
      return unsubscribe;
    }
  }, [rounded, value]);

  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400", 
    neutral: "text-blue-400"
  };

  const glowColors = {
    positive: "shadow-emerald-500/30",
    negative: "shadow-red-500/30", 
    neutral: "shadow-blue-500/30"
  };

  const pulseColors = {
    positive: "animate-pulse-emerald",
    negative: "animate-pulse-red", 
    neutral: "animate-pulse-blue"
  };

  const iconGlowColors = {
    positive: "shadow-emerald-500/50",
    negative: "shadow-red-500/50", 
    neutral: "shadow-blue-500/50"
  };

  const getChangeIcon = () => {
    if (changeType === "positive") return <TrendingUp className="w-4 h-4" />;
    if (changeType === "negative") return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getChangeBg = () => {
    if (changeType === "positive") return "bg-emerald-500/20 border-emerald-500/30";
    if (changeType === "negative") return "bg-red-500/20 border-red-500/30";
    return "bg-blue-500/20 border-blue-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={`p-6 h-40 bg-gradient-to-br from-gray-900/95 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-500 ${glowColors[changeType]} hover:shadow-2xl relative overflow-hidden group`}>
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
          animate={{
            x: isHovered ? ["0%", "100%"] : "0%"
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Floating particles effect */}
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.2, 0.8, 0.2]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-1 h-1 bg-white/30 rounded-full"
          animate={{
            y: [0, -8, 0],
            opacity: [0.3, 0.9, 0.3]
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Additional floating elements */}
        <motion.div
          className="absolute top-4 left-4 w-1 h-1 bg-blue-400/40 rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <motion.div 
            className="flex-1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.p 
              className="text-sm font-medium text-gray-400 mb-2"
              whileHover={{ color: "#60a5fa" }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.p>
            <motion.p 
              className="text-3xl font-bold text-white mb-3"
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                textShadow: isHovered ? "0 0 20px rgba(255,255,255,0.3)" : "none"
              }}
              transition={{ duration: 0.3 }}
            >
              {displayValue}
            </motion.p>
            {change && (
              <motion.div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getChangeBg()} ${changeColors[changeType]}`}
                animate={{ 
                  scale: isHovered ? 1.05 : 1,
                  y: isHovered ? -2 : 0,
                  boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none"
                }}
                transition={{ duration: 0.3 }}
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.2 }
                }}
              >
                <motion.div
                  animate={{
                    rotate: isHovered ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  {getChangeIcon()}
                </motion.div>
                <motion.span 
                  className={`text-sm font-medium ${pulseColors[changeType]}`}
                  animate={{ 
                    opacity: isHovered ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {change}
                </motion.span>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconColor} shadow-lg relative overflow-hidden ${iconGlowColors[changeType]}`}
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)"
            }}
            animate={{
              y: isHovered ? -3 : 0,
              rotate: isHovered ? [0, -5, 5, 0] : 0
            }}
            transition={{ 
              duration: 0.4,
              rotate: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Icon glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl"
              animate={{
                opacity: isHovered ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="relative z-10"
              animate={{
                scale: isHovered ? 1.2 : 1,
                filter: isHovered ? "drop-shadow(0 0 10px rgba(255,255,255,0.5))" : "none"
              }}
              transition={{ duration: 0.3 }}
            >
              {icon}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom glow line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
          animate={{
            scaleX: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Corner accent */}
        <motion.div
          className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full"
          animate={{
            opacity: isHovered ? 1 : 0.3
          }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}
