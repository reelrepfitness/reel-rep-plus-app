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
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1557683316-973673baf926" }}
        style={styles.backgroundImage}
        blurRadius={80}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.centerContainer}>
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.whiteBlur} />
              
              <LinearGradient
                colors={["#6E8AFC", "#375DFB"]}
                style={styles.logoGradient}
              />

              <View style={styles.textSection}>
                <Text style={styles.title}>התחברות</Text>
                <Text style={styles.subtitle}>הזן את האימייל והסיסמה שלך</Text>
              </View>

              <View style={styles.fieldSection}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#ACB5BB"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="סיסמה"
                    placeholderTextColor="#ACB5BB"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textAlign="right"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={16} 
                      color="#ACB5BB" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rememberForgotContainer}>
                  <TouchableOpacity 
                    style={styles.rememberMe}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.rememberText}>זכור אותי</Text>
                  </TouchableOpacity>

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

                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <View style={styles.googleIcon}>
                      <View style={[styles.googlePart, { backgroundColor: "#4285F4", left: "50.9%", right: "6.25%", top: "42.03%", bottom: "16.85%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#34A853", left: "11.01%", right: "19.54%", top: "58.65%", bottom: "6.25%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#FBBC05", left: "6.25%", right: "74.5%", top: "30.15%", bottom: "30.36%" }]} />
                      <View style={[styles.googlePart, { backgroundColor: "#EB4335", left: "11.01%", right: "19.24%", top: "6.25%", bottom: "58.65%" }]} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <View style={styles.facebookIcon}>
                      <LinearGradient
                        colors={["#0062E0", "#19AFFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.facebookBackground}
                      />
                      <View style={styles.facebookF} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Ionicons name="logo-apple" size={18} color="#000000" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Ionicons name="phone-portrait-outline" size={18} color="#04070E" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>אין לך חשבון?</Text>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>הירשם</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
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
  logoGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignSelf: "center" as const,
    zIndex: 1,
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
  inputWrapper: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF1F3",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center" as const,
    shadowColor: "#E4E5E7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: "#1A1C1E",
    textAlign: "right" as const,
  },
  eyeIcon: {
    position: "absolute" as const,
    left: 14,
    padding: 4,
  },
  rememberForgotContainer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  rememberMe: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderWidth: 1.5,
    borderColor: "#6C7278",
    borderRadius: 4,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  checkboxChecked: {
    backgroundColor: "#4D81E7",
    borderColor: "#4D81E7",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  rememberText: {
    fontFamily: "Inter" as const,
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: -0.12,
    color: "#6C7278",
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
  socialRow: {
    flexDirection: "row" as const,
    gap: 15,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFF0F6",
    borderRadius: 10,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#F4F5FA",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: {
    width: 18,
    height: 18,
    position: "relative" as const,
  },
  googlePart: {
    position: "absolute" as const,
  },
  facebookIcon: {
    width: 18,
    height: 18,
    position: "relative" as const,
  },
  facebookBackground: {
    position: "absolute" as const,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  facebookF: {
    position: "absolute" as const,
    left: "29.5%",
    right: "27.5%",
    top: "19.5%",
    bottom: 0,
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 14,
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
    backgroundColor: "#F5F5F5",
  },
});
