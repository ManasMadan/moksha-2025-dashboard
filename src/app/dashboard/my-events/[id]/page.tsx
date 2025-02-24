import React from "react";
import { getEventById } from "@/server/event";
import EditEventForm from "@/components/event/EditEventForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const event = await getEventById(id);

  if (!event.success) {
    return <div>Error loading event: {event.message}</div>;
  }
  if (!event.data) {
    return <div>Event not found</div>;
  }

  return <EditEventForm event={JSON.parse(event.data)} />;
}
