import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

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
  const changeColors = {
    positive: "text-secondary",
    negative: "text-destructive", 
    neutral: "text-accent"
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="text-3xl font-bold text-on-surface mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
