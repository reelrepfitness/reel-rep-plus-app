import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WorkoutLog {
  id: string;
  user_id: string;
  log_date: string;
  workout_type: "strength" | "cardio";
  amount: number;
  created_at: string;
}

export function useWorkoutLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getCurrentWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
      start: formatDate(startOfWeek),
      end: formatDate(endOfWeek),
    };
  };

  const workoutLogsQuery = useQuery({
    queryKey: ["workoutLogs", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("No user");

      const { start, end } = getCurrentWeekRange();
      
      console.log("[WorkoutLogs] Fetching logs for week:", start, "to", end);

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.user_id)
        .gte("log_date", start)
        .lte("log_date", end)
        .order("log_date", { ascending: false });

      if (error) {
        console.error("[WorkoutLogs] Error fetching logs:", error);
        throw error;
      }

      console.log("[WorkoutLogs] Loaded", data?.length || 0, "logs");
      return data as WorkoutLog[];
    },
    enabled: !!user?.user_id,
  });

  const addWorkoutLogMutation = useMutation({
    mutationFn: async ({
      workoutType,
      amount,
      date,
    }: {
      workoutType: "strength" | "cardio";
      amount: number;
      date: string;
    }) => {
      if (!user?.user_id) throw new Error("No user");

      console.log("[WorkoutLogs] Adding log:", workoutType, amount, date);

      const { data, error } = await supabase
        .from("workout_logs")
        .insert([
          {
            user_id: user.user_id,
            log_date: date,
            workout_type: workoutType,
            amount,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("[WorkoutLogs] Error adding log:", error);
        throw error;
      }

      console.log("[WorkoutLogs] Log added");
      return data as WorkoutLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutLogs", user?.user_id] });
    },
  });

  const deleteWorkoutLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      console.log("[WorkoutLogs] Deleting log:", logId);

      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("id", logId);

      if (error) {
        console.error("[WorkoutLogs] Error deleting log:", error);
        throw error;
      }

      console.log("[WorkoutLogs] Log deleted");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutLogs", user?.user_id] });
    },
  });

  const strengthLogs = workoutLogsQuery.data?.filter((log) => log.workout_type === "strength") || [];
  const cardioLogs = workoutLogsQuery.data?.filter((log) => log.workout_type === "cardio") || [];

  const totalStrengthWorkouts = strengthLogs.reduce((sum, log) => sum + Number(log.amount), 0);
  const totalCardioMinutes = cardioLogs.reduce((sum, log) => sum + Number(log.amount), 0);

  return {
    workoutLogs: workoutLogsQuery.data || [],
    strengthLogs,
    cardioLogs,
    totalStrengthWorkouts,
    totalCardioMinutes,
    isLoading: workoutLogsQuery.isLoading,
    addWorkoutLog: addWorkoutLogMutation.mutate,
    deleteWorkoutLog: deleteWorkoutLogMutation.mutate,
    isAddingLog: addWorkoutLogMutation.isPending,
  };
}
