"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, X } from "lucide-react";
import { deleteCookie } from "cookies-next";
import Image from "next/image";
import { auth } from "@/lib/firebase/firebase.config";
import { signOut } from "firebase/auth";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear user role cookie
      deleteCookie("userRole");

      // Redirect to login page after successful logout
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md px-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="relative w-32 h-32">
              <Image src="/images/CICSTASKMGMT_LOGO_NG.png" alt="CICS Logo" layout="fill" className="object-cover" priority />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign Out</CardTitle>
            <CardDescription className="text-center">
              Are you sure you want to sign out of your account?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleCancel} disabled={isLoggingOut}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}