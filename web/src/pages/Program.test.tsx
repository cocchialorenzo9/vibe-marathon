import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Program from "./Program";

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/program" element={<><Program /><Search /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Program page", () => {
  it("opens on the day in ?day= with its week and strength block", () => {
    renderAt("/program?day=2026-11-03&date=2026-10-20");
    expect(screen.getByRole("heading", { level: 2, name: "Rebuild 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Hill sprints + easy" })).toBeInTheDocument();
    expect(screen.getByText("HOME STRENGTH")).toBeInTheDocument();
    const drills = screen.getByRole("list", { name: "Drills in this session" });
    expect(within(drills).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/drills?drill=bss",
      "/drills?drill=rdl",
      "/drills?drill=calf",
      "/drills?drill=bridge",
      "/drills?drill=sideplank",
    ]);
    expect(screen.getByText(/WEEK 4 OF 22/)).toBeInTheDocument();
    expect(screen.getByText("FUEL TEST")).toBeInTheDocument();
  });

  it("falls back to today when no day is selected", () => {
    renderAt("/program?date=2026-10-15");
    expect(screen.getByText(/THURSDAY · 15 OCT 2026 · TODAY/)).toBeInTheDocument();
  });

  it("moves a week at a time and back to today", () => {
    renderAt("/program?date=2026-10-15");
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(screen.getByTestId("search").textContent).toContain("day=2026-10-22");
    fireEvent.click(screen.getByRole("button", { name: "TODAY" }));
    expect(screen.getByTestId("search").textContent).toContain("day=2026-10-15");
  });

  it("selects a day from the calendar", () => {
    renderAt("/program?date=2026-10-15");
    fireEvent.click(screen.getByRole("button", { name: /^SUN 14 MAR: ROME MARATHON/ }));
    expect(screen.getByRole("heading", { level: 3, name: "ROME MARATHON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next week" })).toBeDisabled();
  });
});
