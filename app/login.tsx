import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react-native";
import { isRTL } from '@/lib/utils';

// Enable RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const emailError = email && !email.includes('@') ? 'נא להזין כתובת אימייל תקינה' : '';
  const passwordError = password && password.length < 6 ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : '';

  const handleLogin = async () => {
    if (!email || !password) {
      setError("נא למלא את כל השדות");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "שגיאה בהתחברות";
      
      if (errorMessage.includes("Invalid login") || errorMessage.includes("Invalid")) {
        setError("אימייל או סיסמה שגויים");
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("נא לאמת את כתובת האימייל שלך");
      } else {
        setError("שגיאה בהתחברות. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#5ce1e6", "#5ce1e6", "#ffffff"]}
        locations={[0, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.centerContainer}>
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.whiteBlur} />
              
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: `https://rork.app/pa/b22ezxscydzxy6y59xv7e/logo` }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textSection}>
                <Text style={styles.title}>התחברות</Text>
                <Text style={styles.subtitle}>הזן את האימייל והסיסמה שלך</Text>
              </View>

              <View style={styles.fieldSection}>
                <Input
                  placeholder="yourname@gmail.com"
                  icon={Mail}
                  value={email}
                  onChangeText={setEmail}
                  error={emailError}
                  keyboardType="email-address"
                />

                <Input
                  placeholder="סיסמה"
                  icon={Lock}
                  value={password}
                  onChangeText={setPassword}
                  error={passwordError}
                  secureTextEntry
                />

                <View style={styles.forgotContainer}>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>שכחת סיסמה ?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonsSection}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0)"]} 
                    style={styles.loginButtonGradient}
                  >
                    <View style={styles.loginButtonInner}>
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.loginButtonText}>התחבר</Text>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>או התחבר עם</Text>
                  <View style={styles.orLine} />
                </View>

                <View style={styles.socialColumn}>
                  <TouchableOpacity style={styles.socialButtonFull} activeOpacity={0.7}>
                    <View style={styles.googleIcon}>
                      <View style={[styles.googlePart, { backgroundColor: "#4285F4", left: "50.9%", right: "6.25%", top: "42.03%", bottom: "16.85%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#34A853", left: "11.01%", right: "19.54%", top: "58.65%", bottom: "6.25%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#FBBC05", left: "6.25%", right: "74.5%", top: "30.15%", bottom: "30.36%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#EB4335", left: "11.01%", right: "19.24%", top: "6.25%", bottom: "58.65%" }]} />
                    </View>
                    <Text style={styles.socialButtonText}>התחבר עם Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButtonFull} activeOpacity={0.7}>
                    <Ionicons name="logo-apple" size={18} color="#000000" />
                    <Text style={styles.socialButtonText}>התחבר עם Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>אין לך חשבון?</Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.signUpLink}>הירשם</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
  },
  glassCard: {
    width: 343,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    gap: 24,
    overflow: "hidden" as const,
  },
  whiteBlur: {
    position: "absolute" as const,
    width: 320.5,
    height: 320.5,
    left: 192,
    top: -170.5,
    backgroundColor: "#FFFFFF",
    opacity: 0.5,
    borderRadius: 160.25,
  },
  logoContainer: {
    width: 60,
    height: 60,
    alignSelf: "center" as const,
    zIndex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  textSection: {
    gap: 12,
    alignItems: "center" as const,
    zIndex: 2,
  },
  title: {
    fontFamily: "Inter" as const,
    fontWeight: "700" as const,
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: -0.64,
    color: "#111827",
  },
  subtitle: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#6C7278",
    textAlign: "center" as const,
  },
  fieldSection: {
    gap: 16,
    zIndex: 3,
  },

  forgotContainer: {
    alignItems: "flex-start" as const,
  },
  forgotText: {
    fontFamily: "Inter" as const,
    fontWeight: "600" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#4D81E7",
  },
  errorText: {
    color: "#FF5252",
    textAlign: "center" as const,
    fontSize: 12,
    fontWeight: "500" as const,
  },
  buttonsSection: {
    gap: 24,
    zIndex: 4,
  },
  loginButton: {
    height: 48,
    borderRadius: 10,
    overflow: "hidden" as const,
  },
  loginButtonGradient: {
    flex: 1,
  },
  loginButtonInner: {
    flex: 1,
    backgroundColor: "#1D61E7",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#253EA7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.48,
    shadowRadius: 2,
    elevation: 3,
  },
  loginButtonText: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: "#FFFFFF",
  },
  orContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FFFFFF",
  },
  orText: {
    fontFamily: "Inter" as const,
    fontWeight: "400" as const,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: -0.12,
    color: "#6C7278",
  },
  socialColumn: {
    gap: 15,
  },
  socialButtonFull: {
    flexDirection: "row" as const,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFF0F6",
    borderRadius: 10,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 12,
    shadowColor: "#F4F5FA",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  socialButtonText: {
    fontFamily: "Inter" as const,
    fontWeight: "600" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: "#1A1C1E",
  },
  googleIcon: {
    width: 18,
    height: 18,
    position: "relative" as const,
  },
  googlePart: {
    position: "absolute" as const,
  },

  signUpSection: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 6,
    zIndex: 5,
  },
  signUpText: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#6C7278",
  },
  signUpLink: {
    fontFamily: "Inter" as const,
    fontWeight: "600" as const,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.12,
    color: "#4D81E7",
  },
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },
});
