import * as React from "react";
import { cn } from "@/lib/utils";

interface SparkleProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function Sparkle({ 
  className, 
  color = "bg-primary", 
  size = "md", 
  animated = true,
  ...props 
}: SparkleProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={cn(
        "relative", 
        sizeClasses[size],
        animated && "animate-sparkle",
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <path
          d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"
          className={cn(color)}
        />
      </svg>
    </div>
  );
}

interface SparkleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  colors?: string[];
}

export function SparkleGroup({ 
  className, 
  count = 3,
  colors = ["bg-primary", "bg-purple-500", "bg-blue-400", "bg-pink-400"],
  ...props 
}: SparkleGroupProps) {
  const sparkles = Array.from({ length: count }, (_, i) => {
    const size = i % 3 === 0 ? "lg" : i % 3 === 1 ? "md" : "sm";
    const color = colors[i % colors.length];
    const delay = `delay-[${i * 200}ms]`;
    const position = {
      top: `${-5 + Math.random() * 20}px`,
      left: `${-5 + Math.random() * 120}px`,
    };

    return (
      <Sparkle 
        key={i}
        size={size}
        color={color}
        className={cn(
          "absolute animate-float", 
          delay
        )}
        style={position}
      />
    );
  });

  return (
    <div
      className={cn("relative", className)}
      {...props}
    >
      {sparkles}
    </div>
  );
} 