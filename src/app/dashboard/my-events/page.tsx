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
import { IEvent } from "@/models/Event";
import Link from "next/link";

export default async function Page() {
  const myEvents = await getMyEvents();

  if (!myEvents.success) return <div>Something went wrong !</div>;
  if (!myEvents.data) return <div>No events found</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {myEvents.data.map((event: IEvent) => (
        <Link key={event._id} href={`/dashboard/my-events/${event._id}`}>
          <Card className="overflow-hidden">
            {event.imageKey && (
              <div className="relative w-full" style={{ aspectRatio: "2/1" }}>
                <img
                  src={`/api/images/${event.imageKey}`}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
                Venue: {event.venue}
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {new Date(event.createdAt).toLocaleDateString()}
              </p>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
