"use client";
import React from "react";
import { Button } from "../ui/button";
import { getEventRegById } from "@/server/event";

export default function DownloadRegButton({ eventId }: { eventId: string }) {
  const handleDownload = async () => {
    const reg = await getEventRegById(eventId);
    if (!reg.success || !reg.data) {
      alert("Error fetching registration data");
      return;
    }

    const regArray = JSON.parse(reg.data) as any[];

    // Generate CSV content
    const csvContent = generateCSV(regArray);

    // Create a blob and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Get event name for the filename
    const eventName =
      regArray.length > 0
        ? regArray[0].eventId.name.replace(/\s+/g, "_")
        : "event";

    link.setAttribute("href", url);
    link.setAttribute("download", `${eventName}_registrations.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <Button onClick={handleDownload}>Download Registrations</Button>;
}

function generateCSV(regArray: any[]): string {
  if (regArray.length === 0) return "";

  // Extract custom input labels from the first registration's event
  const customInputLabels = regArray[0].eventId.customInputs.map(
    (input: any) => input.label
  );

  // Create headers
  const headers = [
    "Registration ID",
    "Name",
    "Email",
    "Phone",
    "College",
    "Year of Passing",
    "Age",
    "Registration Date",
    ...customInputLabels,
  ];

  // Create CSV rows
  const rows = regArray.map((reg) => {
    // Get the first team member (or only participant)
    const member = reg.teamMembers[0];

    // Map custom input values to their corresponding labels
    const customValues: { [key: string]: string } = {};

    // Find custom input values
    reg.customInputValues.forEach((inputValue: any) => {
      // Find the matching custom input from eventId.customInputs
      const matchingInput = reg.eventId.customInputs.find(
        (input: any) => input._id === inputValue.inputId
      );

      if (matchingInput) {
        customValues[matchingInput.label] = inputValue.value;
      }
    });

    // Create row with standard fields
    const row = [
      reg._id,
      member.name,
      member.email,
      member.phone,
      member.college,
      member.yearOfPassing,
      member.age,
      new Date(reg.registrationDate).toLocaleDateString(),
    ];

    // Add custom input values in the same order as headers
    customInputLabels.forEach((label: any) => {
      row.push(customValues[label] || "");
    });

    return row;
  });

  // Convert to CSV string
  const csvRows = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSVValue).join(",")),
  ];

  return csvRows.join("\n");
}

// Helper function to escape values for CSV
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  // If the value contains a comma, newline, or double quote, wrap it in double quotes
  if (/[",\n\r]/.test(stringValue)) {
    // Replace double quotes with two double quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
