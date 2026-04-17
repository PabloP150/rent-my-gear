import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Home page", () => {
  it("renders the category grid", () => {
    render(<Page />);
    expect(screen.getByText("Explora por categoría")).toBeInTheDocument();
    expect(screen.getByText("Fotografía y Video")).toBeInTheDocument();
    expect(screen.getByText("Montaña y Camping")).toBeInTheDocument();
    expect(screen.getByText("Deportes Acuáticos")).toBeInTheDocument();
  });
});
