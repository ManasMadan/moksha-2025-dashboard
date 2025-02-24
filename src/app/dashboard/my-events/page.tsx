import { getMyEvents } from "@/server/event";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Page() {
  const myEvents = await getMyEvents();

  if (!myEvents.success) return <div>Something went wrong !</div>;
  if (!myEvents.data) return <div>No events found</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {myEvents.data.map((event) => (
        <Card key={event._id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>Day {event.day}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {event.startTime} - {event.endTime}
            </p>
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-between">
            <p className="text-xs text-muted-foreground">
              Created: {new Date(event.createdAt).toLocaleDateString()}
            </p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
