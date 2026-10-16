import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Drills from "./Drills";

describe("Drills page", () => {
  it("lists every drill with its animation and muscles", () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <MemoryRouter initialEntries={["/drills?drill=rdl"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Drills />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Drill library" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(15);
    expect(screen.getByRole("img", { name: "Copenhagen plank animation" })).toBeInTheDocument();
    const rdl = document.getElementById("drill-rdl")!;
    expect(rdl).toHaveClass("focused");
    expect(within(rdl).getByText("Hamstrings")).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
