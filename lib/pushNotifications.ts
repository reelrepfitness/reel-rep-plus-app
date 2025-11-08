import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

type TokenCallback = (token: string) => void | Promise<void>;

let tokenCallback: TokenCallback | null = null;
let notificationListeners: {
  received?: Notifications.Subscription;
  response?: Notifications.Subscription;
} = {};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Failed to get push token - permission denied");
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error("❌ Project ID not found in app config");
      return;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
      console.log("✅ Push token obtained:", token);

      if (tokenCallback && token) {
        console.log("📤 Sending token to callback");
        await tokenCallback(token);
      }
    } catch (error) {
      console.error("❌ Error getting push token:", error);
    }
  } else {
    console.log("⚠️ Must use physical device for Push Notifications");
  }

  return token;
}

export function setupNotificationListeners() {
  notificationListeners.received =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("📩 Notification received:", notification);
      console.log("📩 Title:", notification.request.content.title);
      console.log("📩 Body:", notification.request.content.body);
      console.log("📩 Data:", notification.request.content.data);
    });

  notificationListeners.response =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response);
      console.log("👆 Action:", response.actionIdentifier);
      console.log("👆 Data:", response.notification.request.content.data);
    });

  console.log("✅ Notification listeners setup complete");
}

export function removeNotificationListeners() {
  if (notificationListeners.received) {
    notificationListeners.received.remove();
    console.log("🗑️ Removed notification received listener");
  }

  if (notificationListeners.response) {
    notificationListeners.response.remove();
    console.log("🗑️ Removed notification response listener");
  }

  notificationListeners = {};
}

export function setTokenCallback(callback: TokenCallback) {
  console.log("📝 Token callback registered");
  tokenCallback = callback;
}

export async function initializeNotifications(
  onTokenReceived?: TokenCallback
) {
  console.log("🚀 Initializing push notifications...");

  if (onTokenReceived) {
    setTokenCallback(onTokenReceived);
  }

  setupNotificationListeners();

  const token = await registerForPushNotificationsAsync();

  return token;
}

export function cleanupNotifications() {
  console.log("🧹 Cleaning up notifications...");
  removeNotificationListeners();
  tokenCallback = null;
}
