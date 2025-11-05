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
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";

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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("שגיאה", "נא להזין כתובת אימייל");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://rork.app",
      });

      if (error) {
        console.error("Reset password error:", error);
        setError("שגיאה בשליחת אימייל לאיפוס סיסמה");
      } else {
        Alert.alert(
          "הצלחה",
          "נשלח אימייל לאיפוס סיסמה. אנא בדוק את תיבת הדואר שלך."
        );
      }
    } catch (err: unknown) {
      console.error("Reset password error:", err);
      setError("שגיאה בשליחת אימייל");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.topSection, { paddingTop: insets.top }]}>
        <Image
          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759152311/%D7%9C%D7%A6%D7%9C_bcitzd.png" }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={[styles.bottomSection, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>כניסה</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>שכחתי סיסמה</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1c1c",
  },
  topSection: {
    flex: 1,
    backgroundColor: "#0c1c1c",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  bottomSection: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.white,
  },
  errorText: {
    color: "#FF5252",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.gray,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: colors.white,
    fontSize: 16,
    textDecorationLine: "underline" as const,
  },
});
