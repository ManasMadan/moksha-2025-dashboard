import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvents, updateEvent, deleteEvent, addEvent } from "@/server/event";

export function useEvents() {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await getEvents();
      if (!response.success) {
        throw new Error(response.message);
      }
      return JSON.parse(response?.data as string) || [];
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData: FormData) => {
      const response = await addEvent(eventData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: FormData) => {
      const response = await updateEvent(eventData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return JSON.parse(response?.data as string) || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventData: FormData) => {
      const response = await deleteEvent(eventData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return {
    eventsQuery,
    addEventMutation,
    updateEventMutation,
    deleteEventMutation,
  };
}
