"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Éviter l'hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Basculer entre les thèmes : light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Basculer simplement entre light et dark
  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  // Afficher un placeholder pendant le montage pour éviter le flash
  if (!mounted) {
    return (
      <Button variant="ghost" size="2" aria-label="Chargement du thème">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-5 w-5" />;
    }
    return resolvedTheme === "light" ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    );
  };

  const getLabel = () => {
    if (theme === "system") {
      return "Thème automatique (système)";
    }
    return `Basculer en mode ${resolvedTheme === "light" ? "sombre" : "clair"}`;
  };

  return (
    <Button
      variant="ghost"
      size="2"
      onClick={toggleTheme}
      onDoubleClick={cycleTheme}
      aria-label={getLabel()}
      title={`${getLabel()} (double-clic pour le mode automatique)`}
    >
      {getIcon()}
    </Button>
  );
}
