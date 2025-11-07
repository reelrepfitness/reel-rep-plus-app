import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { Ionicons } from "@expo/vector-icons";

// Enable RTL
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#0D0D1B", "#1a1a2e", "#0D0D1B"]}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        {/* Decorative Background Elements */}
        <View style={styles.decorativeElements}>
          {[...Array(30)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  opacity: 0.3 + Math.random() * 0.4,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.contentContainer}>
          {/* Logo/Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>ברוך הבא</Text>
            <Text style={styles.subtitle}>התחבר כדי להמשיך</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <View style={styles.tabActive}>
                <Text style={styles.tabTextActive}>כניסה</Text>
              </View>
              <View style={styles.tabInactive}>
                <Text style={styles.tabTextInactive}>הרשמה</Text>
              </View>
            </View>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#7D7D91" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="אימייל"
                  placeholderTextColor="#7D7D91"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#7D7D91" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="סיסמה"
                  placeholderTextColor="#7D7D91"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textAlign="right"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>שכחת סיסמה?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#1D61E7", "#2D6FF7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>כניסה</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>או</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              {/* Continue with Google */}
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <View style={styles.socialContent}>
                  <View style={styles.googleLogo}>
                    <Text style={styles.googleLogoText}>G</Text>
                  </View>
                  <Text style={styles.socialButtonText}>המשך עם Google</Text>
                </View>
              </TouchableOpacity>

              {/* Continue with Apple */}
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <View style={styles.socialContent}>
                  <Ionicons name="logo-apple" size={24} color="#1A1C1E" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>המשך עם Apple</Text>
                </View>
              </TouchableOpacity>

              {/* Continue with Facebook */}
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <View style={styles.socialContent}>
                  <View style={styles.facebookLogo}>
                    <Text style={styles.facebookLogoText}>f</Text>
                  </View>
                  <Text style={styles.socialButtonText}>המשך עם Facebook</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Indicator */}
        <View style={[styles.bottomIndicator, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.indicator} />
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1B",
  },
  gradient: {
    flex: 1,
  },
  decorativeElements: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: "absolute" as const,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#EEEEEE",
    opacity: 0.7,
    textAlign: "center",
  },
  formSection: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row" as const,
    backgroundColor: "#F5F6F9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tabActive: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#232447",
  },
  tabTextInactive: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#7D7D91",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1A1C1E",
  },
  errorText: {
    color: "#FF5252",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#4D81E7",
    fontWeight: "500" as const,
  },
  loginButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  dividerContainer: {
    flexDirection: "row" as const,
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EDF1F3",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#6C7278",
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFF0F6",
    overflow: "hidden",
    shadowColor: "#F5F6F9",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  socialContent: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  socialIcon: {
    marginLeft: 12,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  googleLogoText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  facebookLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  facebookLogoText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1C1E",
  },
  bottomIndicator: {
    alignItems: "center",
    paddingTop: 16,
  },
  indicator: {
    width: 134,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#111827",
  },
});
