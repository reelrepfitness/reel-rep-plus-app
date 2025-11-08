import { supabase } from "@/lib/supabase";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

export interface PushResponse {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

export interface SendResult {
  token: string;
  userId: string;
  success: boolean;
  error?: string;
  ticketId?: string;
}

export async function sendPushNotification(
  message: PushMessage
): Promise<PushResponse> {
  try {
    console.log("📤 Sending push notification:", message);

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log("📥 Push response:", data);

    if (data.data && data.data[0]) {
      return data.data[0];
    }

    return data;
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPushNotifications(
  messages: PushMessage[]
): Promise<PushResponse[]> {
  try {
    console.log(`📤 Sending ${messages.length} push notifications`);

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    console.log("📥 Push responses:", data);

    if (data.data) {
      return data.data;
    }

    return [data];
  } catch (error) {
    console.error("❌ Error sending push notifications:", error);
    return messages.map(() => ({
      status: "error" as const,
      message: error instanceof Error ? error.message : "Unknown error",
    }));
  }
}

export async function sendToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
  sentBy?: string
): Promise<SendResult[]> {
  try {
    console.log(`🎯 Sending notifications to ${userIds.length} users`);

    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (error) {
      console.error("❌ Error fetching push tokens:", error);
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      console.log("⚠️ No push tokens found for selected users");
      return [];
    }

    console.log(`✅ Found ${tokens.length} push tokens`);

    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: "default",
      priority: "high",
    }));

    const responses = await sendPushNotifications(messages);

    const results: SendResult[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const response = responses[i];
      const success = response?.status === "ok";
      const error =
        response?.status === "error"
          ? response?.message || response?.details?.error
          : undefined;

      results.push({
        token: token.token,
        userId: token.user_id,
        success,
        error,
        ticketId: response?.id,
      });

      const logStatus = success ? "sent" : "failed";
      const errorMessage =
        error === "DeviceNotRegistered" ? "Device not registered" : error;

      await supabase.from("notification_logs").insert({
        sent_by: sentBy || null,
        recipient_user_id: token.user_id,
        push_token: token.token,
        title,
        body,
        data: data || null,
        status: logStatus,
        error_message: errorMessage || null,
      });

      if (error === "DeviceNotRegistered") {
        console.log(`🗑️ Removing invalid token for user ${token.user_id}`);
        await supabase.from("push_tokens").delete().eq("token", token.token);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ Successfully sent ${successCount}/${results.length} notifications`);

    return results;
  } catch (error) {
    console.error("❌ Error in sendToUsers:", error);
    throw error;
  }
}

export async function sendToAllUsers(
  title: string,
  body: string,
  data?: Record<string, any>,
  sentBy?: string
): Promise<SendResult[]> {
  try {
    console.log("🌐 Sending notifications to all users");

    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token, user_id");

    if (error) {
      console.error("❌ Error fetching push tokens:", error);
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      console.log("⚠️ No push tokens found");
      return [];
    }

    const userIds = tokens.map((t) => t.user_id);
    return sendToUsers(userIds, title, body, data, sentBy);
  } catch (error) {
    console.error("❌ Error in sendToAllUsers:", error);
    throw error;
  }
}
