import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext.jsx";
import { toast } from "sonner";
import useDocumentTitle from "@/hooks/useDocumentTitle.js";

export default function RequestAccess() {
  const { requestAccess } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // digits only, 10 max
  const [gender, setGender] = useState("other");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  useDocumentTitle("Request Access");

  function toTitleCaseLettersOnly(value) {
    const lettersAndSpaces = value.replace(/[^A-Za-z ]+/g, "");
    return lettersAndSpaces
      .replace(/\s+/g, " ")
      .replace(
        /\b([A-Za-z])(\w*)/g,
        (_, f, rest) => f.toUpperCase() + rest.toLowerCase(),
      );
  }

  function handleNameChange(e) {
    const next = toTitleCaseLettersOnly(e.target.value);
    setName(next);
  }

  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // validations
      if (!name || !/^[A-Za-z ]+$/.test(name)) {
        toast.error(
          "Please enter a valid full name (letters and spaces only).",
        );
        return;
      }
      // basic password rules: min 8 chars, at least one letter and one number
      if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
      ) {
        toast.error(
          "Password must be at least 8 characters and include at least one letter and one number.",
        );
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (phone.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number.");
        return;
      }

      // require gender selection (default is "other")
      if (!["male", "female", "other"].includes(gender)) {
        toast.error("Please select a gender.");
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: `+91${phone}`,
        password,
        gender,
      };

      await requestAccess(payload);
      toast.success(
        "Access request submitted. An admin will review your request.",
      );
      navigate("/sign-in", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link to="/">
            <img
              src="/images/welcome-logo-2.png"
              alt="AerisGo"
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Request access</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Only approved staff/admin can sign in
                  </p>
                </div>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={handleNameChange}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 bg-input/50 px-3 text-sm text-foreground/80">
                        +91
                      </span>
                      <Input
                        id="phone"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="rounded-l-none"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="10-digit number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <div
                      role="radiogroup"
                      aria-label="Gender"
                      className="grid grid-cols-3 gap-2"
                    >
                      <Button
                        type="button"
                        variant={gender === "male" ? "default" : "outline"}
                        aria-pressed={gender === "male"}
                        onClick={() => setGender("male")}
                        className="w-full"
                      >
                        Male
                      </Button>
                      <Button
                        type="button"
                        variant={gender === "female" ? "default" : "outline"}
                        aria-pressed={gender === "female"}
                        onClick={() => setGender("female")}
                        className="w-full"
                      >
                        Female
                      </Button>
                      <Button
                        type="button"
                        variant={gender === "other" ? "default" : "outline"}
                        aria-pressed={gender === "other"}
                        onClick={() => setGender("other")}
                        className="w-full"
                      >
                        Other
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        placeholder="••••••••"
                        minLength={8}
                        pattern="^(?=.*[A-Za-z])(?=.*\\d).{8,}$"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.67 20.67 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.66 20.66 0 0 1-4.07 5.17" />
                            <path d="M14.12 9.88a3 3 0 1 1-4.24 4.24" />
                            <path d="M1 1l22 22" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pr-10"
                        placeholder="Re-enter password"
                        minLength={8}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.67 20.67 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.66 20.66 0 0 1-4.07 5.17" />
                            <path d="M14.12 9.88a3 3 0 1 1-4.24 4.24" />
                            <path d="M1 1l22 22" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Submit request"}
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      to="/sign-in"
                      className="underline underline-offset-4"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/images/auth-bg.png"
          alt="AerisGo"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Join the AerisGo team
          </h2>
          <p className="text-white/90 text-lg">
            Request access to help manage and grow our flight operations
          </p>
        </div>
      </div>
    </div>
  );
}
