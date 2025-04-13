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

  // Collect all unique custom input labels across all registrations
  const allCustomInputLabels = new Set<string>();

  // Track the maximum number of unlabeled inputs in any registration
  let maxUnlabeledInputs = 0;

  regArray.forEach((reg) => {
    if (reg.eventId && reg.eventId.customInputs) {
      reg.eventId.customInputs.forEach((input: any) => {
        if (input.label) {
          allCustomInputLabels.add(input.label);
        }
      });
    }

    // Count unlabeled inputs
    if (reg.customInputValues) {
      let unlabeledCount = 0;
      reg.customInputValues.forEach((inputValue: any) => {
        const hasMatchingLabel = reg.eventId?.customInputs?.some(
          (input: any) => input._id === inputValue.inputId && input.label
        );

        if (!hasMatchingLabel) {
          unlabeledCount++;
        }
      });

      maxUnlabeledInputs = Math.max(maxUnlabeledInputs, unlabeledCount);
    }
  });

  // Convert Set to Array for consistent ordering
  const customInputLabels = Array.from(allCustomInputLabels);

  // Create headers for unlabeled inputs
  const unlabeledHeaders = Array(maxUnlabeledInputs)
    .fill(0)
    .map((_, i) => `Unlabeled Input ${i + 1}`);

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
    ...unlabeledHeaders,
  ];

  // Create CSV rows
  const rows = regArray.map((reg) => {
    // Get the first team member (or only participant)
    const member = reg.teamMembers[0];

    // Map custom input values to their corresponding labels
    const customValues: { [key: string]: string } = {};
    const unlabeledInputs: string[] = [];

    // Get the custom input labels specific to this registration
    const regCustomLabels =
      reg.eventId?.customInputs?.map((input: any) => ({
        id: input._id,
        label: input.label,
      })) || [];

    // Find custom input values
    if (reg.customInputValues) {
      reg.customInputValues.forEach((inputValue: any) => {
        // Find the matching custom input from this registration's customInputs
        const matchingInput = regCustomLabels.find(
          (input: any) => input.id === inputValue.inputId
        );

        if (matchingInput && matchingInput.label) {
          customValues[matchingInput.label] = inputValue.value;
        } else {
          // Add to unlabeled inputs
          unlabeledInputs.push(inputValue.value || "");
        }
      });
    }

    // Create row with standard fields
    const row = [
      reg._id || "",
      member?.name || "",
      member?.email || "",
      member?.phone || "",
      member?.college || "",
      member?.yearOfPassing || "",
      member?.age || "",
      reg.registrationDate
        ? new Date(reg.registrationDate).toLocaleDateString()
        : "",
    ];

    // Add custom input values in the same order as headers
    customInputLabels.forEach((label: string) => {
      row.push(customValues[label] || "");
    });

    // Add unlabeled inputs in their own columns
    for (let i = 0; i < maxUnlabeledInputs; i++) {
      row.push(unlabeledInputs[i] || "");
    }

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
