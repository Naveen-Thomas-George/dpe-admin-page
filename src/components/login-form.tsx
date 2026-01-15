"use client";

import React, { useState } from "react";
import { signIn } from 'aws-amplify/auth'; // Import AWS Auth
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

interface User {
  username: string;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Props for the parent component
interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "rememberMe" ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when typing
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: formData.email,
        password: formData.password,
      });

      if (isSignedIn) {
        onLoginSuccess({ username: formData.email });
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setError("First time login? Please change your password via the AWS Console or ask admin.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",        // Force full viewport width
        height: "100vh",       // Force full viewport height
        display: "grid",
        // Mobile: 1 column, Desktop: 2 columns (45% image, 55% form)
        gridTemplateColumns: { xs: "1fr", md: "45fr 55fr" },
        overflow: "hidden",    // Prevent scrolling
      }}
    >
      {/* LEFT PANEL - Space Image */}
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" }, // Hide on mobile
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
          color: "white",
          textAlign: "center",
          background: `linear-gradient(135deg, rgba(13, 27, 42, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%), url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1352&q=80")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Typography variant="h2" fontWeight="300" sx={{ mb: 2 }}>
          Admin Portal | DPE'26
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 400 }}>
          Manage users, forms, and data securely.
        </Typography>
      </Box>

      {/* RIGHT PANEL - Login Form */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center", // VERTICAL CENTER
          bgcolor: "background.paper",
          p: 4,
          height: "100%", // Take full height of parent
        }}
      >
        {/* Form Container */}
        <Box sx={{ width: "100%", maxWidth: 420 }}> 
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter your details to sign in
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                required
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange("password")}
                required
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <Stack direction="row" justifyContent="space-between" alignItems="center" color="text.secondary">
                <FormControlLabel
                  control={<Checkbox checked={formData.rememberMe} onChange={handleInputChange("rememberMe")} />}
                  label="Remember me"
                />
                <Link href="#" underline="hover" variant="body2">
                  Forgot password?
                </Link>
              </Stack>

              <Button 
                fullWidth 
                size="large" 
                type="submit" 
                variant="contained" 
                disabled={loading}
                sx={{ height: 48, fontSize: '1rem' }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 4 }}>OR</Divider>
            <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Please contact IT&Records Committee for issues.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}