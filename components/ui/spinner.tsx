import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ 
  className, 
  size = "md", 
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6"
  };

  return (
    <div 
      className={cn("animate-spin text-muted-foreground", className)}
      aria-label="Loading"
      {...props}
    >
      <Loader2 className={cn(sizeClasses[size])} />
    </div>
  );
} 