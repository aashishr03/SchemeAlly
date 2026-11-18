import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";

describe("Phase 1 — Reusable UI Components", () => {
  it("renders Button variants and supports asChild composition", () => {
    render(
      <div>
        <Button variant="default">Primary Navy</Button>
        <Button variant="emerald">Emerald Action</Button>
        <Button variant="glass">Glass Action</Button>
      </div>
    );

    expect(screen.getByRole("button", { name: "Primary Navy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emerald Action" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Glass Action" })).toBeInTheDocument();
  });

  it("renders Card with glass, solid, and subtle variants", () => {
    render(
      <Card variant="glass" data-testid="test-card">
        <CardHeader>
          <CardTitle>Scheme Card Title</CardTitle>
          <CardDescription>Scheme Card Description</CardDescription>
        </CardHeader>
        <CardContent>Body Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("test-card")).toHaveClass("glass-surface");
    expect(screen.getByText("Scheme Card Title")).toBeInTheDocument();
    expect(screen.getByText("Scheme Card Description")).toBeInTheDocument();
    expect(screen.getByText("Body Content")).toBeInTheDocument();
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("renders Badge variants and Progress bar with clamped percentage", () => {
    render(
      <div>
        <Badge variant="emeraldSoft">Verified</Badge>
        <Progress value={75} aria-label="Readiness progress" />
      </div>
    );

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Readiness progress" })).toBeInTheDocument();
  });

  it("renders EmptyState with badge, title, description, and action links", () => {
    render(
      <EmptyState
        badge="Catalogue"
        title="No schemes found"
        description="Please adjust your search filters."
        icon={Compass}
        primaryActionLabel="Reset Filters"
        primaryActionHref="/discover"
        secondaryActionLabel="Go Home"
        secondaryActionHref="/"
      />
    );

    expect(screen.getByText("Catalogue")).toBeInTheDocument();
    expect(screen.getByText("No schemes found")).toBeInTheDocument();
    expect(screen.getByText("Please adjust your search filters.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reset Filters/i })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(screen.getByRole("link", { name: /Go Home/i })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
