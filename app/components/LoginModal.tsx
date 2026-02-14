"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginModal } from "@/app/context/LoginModalContext";
import { signIn, signOut, useSession } from "next-auth/react"


export const LoginModal: React.FC = () => {
  const { isOpen, setIsOpen, isEmployee } = useLoginModal();
  const { data: session } = useSession()
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-accents border border-primary/20 shadow-2xl overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accents to-secondary/10 -z-10" />
        
        <div className="p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-brasika text-3xl sm:text-4xl text-secondary text-center">
              {isEmployee ? "Employee Login" : "Welcome"}
            </DialogTitle>
            <DialogDescription className="font-sifonn text-muted-foreground text-center text-base">
              {isEmployee 
                ? "Sign in to access your employee portal" 
                : "Sign in to continue to your account"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-8">
            {!isEmployee ? session ? null:(
              // Social Login for regular users
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="font-sifonn bg-primary text-accents hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => signIn("google")}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
            ) : (
              // Email/Password for employees only
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sifonn text-secondary">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    className="font-sifonn border-border focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-sifonn text-secondary">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="font-sifonn border-border focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 font-sifonn cursor-pointer">
                    <input type="checkbox" className="rounded border-border accent-primary" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button className="font-sifonn text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button 
                  className="w-full font-sifonn bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-lg"
                  size="lg"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
