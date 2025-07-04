"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, X, Info } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  
  // Error states for each field
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Password validation criteria
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Validate name
  const validateName = (value: string) => {
    if (value.length < 2) {
      setNameError("Name muss mindestens 2 Zeichen lang sein");
      return false;
    }
    setNameError("");
    return true;
  };

  // Validate email
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Bitte gib eine gültige E-Mail-Adresse ein");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Monitor password strength and validate
  useEffect(() => {
    if (password) {
      // Check criteria
      const minLength = password.length >= 8;
      const uppercase = /[A-Z]/.test(password);
      const lowercase = /[a-z]/.test(password);
      const number = /[0-9]/.test(password);
      const matches = password === confirmPassword && password !== "";
      
      // Update state for criteria
      setHasMinLength(minLength);
      setHasUppercase(uppercase);
      setHasLowercase(lowercase);
      setHasNumber(number);
      setPasswordsMatch(matches);
      
      // Calculate strength (0-100)
      let strength = 0;
      if (minLength) strength += 25;
      if (uppercase) strength += 25;
      if (lowercase) strength += 25;
      if (number) strength += 25;
      
      setPasswordStrength(strength);
      
      // Set feedback based on strength
      if (strength < 50) {
        setPasswordFeedback("Schwaches Passwort");
      } else if (strength < 100) {
        setPasswordFeedback("Mittleres Passwort");
      } else {
        setPasswordFeedback("Starkes Passwort");
      }
      
      // Set error if criteria aren't met
      if (password.length > 0 && (!minLength || !uppercase || !lowercase || !number)) {
        setPasswordError("Passwort erfüllt nicht alle Kriterien");
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordStrength(0);
      setPasswordFeedback("");
      setPasswordError("");
      
      // Reset criteria
      setHasMinLength(false);
      setHasUppercase(false);
      setHasLowercase(false);
      setHasNumber(false);
    }
    
    // Check if passwords match
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwörter stimmen nicht überein");
    } else {
      setConfirmPasswordError("");
    }
  }, [password, confirmPassword]);

  const validateForm = () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = 
      hasMinLength && hasUppercase && hasLowercase && hasNumber;
    const doPasswordsMatch = password === confirmPassword;
    
    if (!isPasswordValid) {
      setPasswordError("Passwort erfüllt nicht alle Kriterien");
    }
    
    if (!doPasswordsMatch) {
      setConfirmPasswordError("Passwörter stimmen nicht überein");
    }
    
    return isNameValid && isEmailValid && isPasswordValid && doPasswordsMatch;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          // Format validation errors from server
          const serverErrors = data.errors.map((err: any) => err.message).join(", ");
          throw new Error(serverErrors || data.message || "Ungültige Eingaben");
        } else if (response.status === 409) {
          throw new Error("Diese E-Mail-Adresse wird bereits verwendet");
        } else {
          throw new Error(data.message || "Registrierung fehlgeschlagen");
        }
      }

      // Sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/"
      });

      if (signInResult?.error) {
        console.error("SignIn Error:", signInResult.error);
        throw new Error(`Anmeldung nach Registrierung fehlgeschlagen: ${signInResult.error}`);
      }

      // Use window.location for a more reliable redirect that forces a full page reload
      if (signInResult?.url) {
        window.location.href = signInResult.url;
      } else {
        // Fallback to router if no URL is returned
        router.push("/");
        router.refresh();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Bei der Registrierung ist ein Fehler aufgetreten";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
          <CardDescription>
            Gib deine Daten ein, um ein neues Konto zu erstellen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value) validateName(e.target.value);
                }}
                placeholder="Vor- und Nachname"
                required
                className={nameError ? "border-red-500" : ""}
              />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) validateEmail(e.target.value);
                }}
                placeholder="name@beispiel.de"
                required
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Passwort
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={passwordError ? "border-red-500" : ""}
              />
              
              {password && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{passwordFeedback}</span>
                      <span className="text-xs">{passwordStrength}%</span>
                    </div>
                    <Progress value={passwordStrength} className="h-1" />
                  </div>
                  
                  <div className="space-y-2 mt-2 text-xs">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                      <span>Mindestens 8 Zeichen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUppercase ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                      <span>Mindestens ein Großbuchstabe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasLowercase ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                      <span>Mindestens ein Kleinbuchstabe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasNumber ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                      <span>Mindestens eine Zahl</span>
                    </div>
                  </div>
                </>
              )}
              
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Passwort bestätigen
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={confirmPasswordError ? "border-red-500" : ""}
              />
              {confirmPasswordError && (
                <p className="text-xs text-red-500">{confirmPasswordError}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrierung läuft..." : "Registrieren"}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Oder fortfahren mit</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Mit Google registrieren
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Du hast bereits ein Konto?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Anmelden
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 