import { getMyEvents } from "@/server/event";
import React from "react";

export default async function page() {
  const myEvents = await getMyEvents();
  console.log(myEvents);
  return <div>page</div>;
}
