"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { EventModal } from "@/components/event/event.modal";
import { DeleteConfirmModal } from "@/components/event/delete.modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import { IEvent } from "@/models/Event";

export default function EventsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [deleteEventData, setDeleteEventData] = useState<IEvent | null>(null);

  const {
    eventsQuery: { data: eventsData, isLoading, isError, error },
    addEventMutation,
    updateEventMutation,
    deleteEventMutation,
  } = useEvents();

  const handleAddEvent = (newEventData: {
    name: string;
    owner: string;
    day: number;
    startTime: string;
    endTime: string;
    venue: string;
  }) => {
    const formData = new FormData();
    formData.append("name", newEventData.name);
    formData.append("owner", newEventData.owner);
    formData.append("day", newEventData.day.toString());
    formData.append("startTime", newEventData.startTime);
    formData.append("endTime", newEventData.endTime);
    formData.append("venue", newEventData.venue);

    addEventMutation.mutate(formData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        toast.success("Event added successfully");
      },
    });
  };

  const handleEditEvent = (updatedEventData: {
    name: string;
    owner: string;
    day: number;
    startTime: string;
    endTime: string;
    venue: string;
  }) => {
    const formData = new FormData();
    formData.append("eventId", editingEvent?._id || "");
    formData.append("name", updatedEventData.name);
    formData.append("owner", updatedEventData.owner);
    formData.append("day", updatedEventData.day.toString());
    formData.append("startTime", updatedEventData.startTime);
    formData.append("endTime", updatedEventData.endTime);
    formData.append("venue", updatedEventData.venue);

    updateEventMutation.mutate(formData, {
      onSuccess: () => {
        setEditingEvent(null);
        toast.success("Event updated successfully");
      },
    });
  };

  const handleDeleteEvent = () => {
    if (!deleteEventData?._id) return;

    const formData = new FormData();
    formData.append("eventId", deleteEventData._id);

    deleteEventMutation.mutate(formData, {
      onSuccess: () => {
        setDeleteEventData(null);
        toast.success("Event deleted successfully");
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1>Event Management</h1>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full mb-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading events: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsData?.map((event: IEvent) => (
              <TableRow key={event._id}>
                <TableCell>{event.name}</TableCell>
                <TableCell>
                  {event.owner
                    ? (event.owner as any).email
                    : "The Owner was deleted, assign a new owner"}
                </TableCell>
                <TableCell>{event.day}</TableCell>
                <TableCell>{event.startTime}</TableCell>
                <TableCell>{event.endTime}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingEvent(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteEventData(event)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEvent}
        initialData={null}
        isLoading={addEventMutation.isPending}
        error={addEventMutation.error as Error | null}
      />

      <EventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSubmit={handleEditEvent}
        initialData={editingEvent}
        isLoading={updateEventMutation.isPending}
        error={updateEventMutation.error as Error | null}
      />

      <DeleteConfirmModal
        isOpen={!!deleteEventData}
        onClose={() => setDeleteEventData(null)}
        name={deleteEventData?.name || ""}
        onConfirm={handleDeleteEvent}
        isLoading={deleteEventMutation.isPending}
        error={deleteEventMutation.error as Error | null}
      />
    </div>
  );
}
