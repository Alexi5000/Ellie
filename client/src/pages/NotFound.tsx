import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-amber/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber" />
          </div>
        </div>
        <h1 className="font-display text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">
          This page doesn't exist. It may have been moved or deleted.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-amber text-background hover:bg-amber/90 font-semibold px-6"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
