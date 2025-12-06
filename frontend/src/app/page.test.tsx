import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Jobseeker"
    );
  });

  it("renders the description", () => {
    render(<Home />);
    expect(screen.getByText(/AI-enhanced job search/i)).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
      "href",
      "/docs"
    );
  });
});
