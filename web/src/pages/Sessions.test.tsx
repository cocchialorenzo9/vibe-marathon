import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Sessions from "./Sessions";

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/sessions" element={<><Sessions /><Search /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Sessions page", () => {
  it("opens on the latest synced session with its review", () => {
    renderAt("/sessions?date=2026-10-17");
    expect(screen.getByRole("heading", { level: 2, name: "Recovery run, a little too quick" })).toBeInTheDocument();
    expect(screen.getByText("+4 over cap")).toBeInTheDocument();
    expect(screen.getByText("WHERE THE RUN SAT · HR BANDS")).toBeInTheDocument();
    expect(screen.getByText("WHAT TO CARRY FORWARD")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the day in the program" })).toHaveAttribute("href", "/program?day=2026-10-17");
  });

  it("lists only past days, newest first", () => {
    renderAt("/sessions?date=2026-10-17");
    const rows = screen.getAllByRole("button", { pressed: false }).concat(screen.getAllByRole("button", { pressed: true }));
    const labels = rows.map((r) => r.textContent ?? "");
    expect(labels.some((t) => t.includes("SUN 18 OCT"))).toBe(false);
    expect(labels.some((t) => t.includes("MON 12 OCT"))).toBe(true);
  });

  it("selects a moved session", () => {
    renderAt("/sessions?date=2026-10-17");
    fireEvent.click(screen.getByRole("button", { name: /THU 15 OCT/ }));
    expect(screen.getByTestId("search").textContent).toContain("day=2026-10-15");
    expect(screen.getByRole("heading", { level: 2, name: "Recovery run moved to Friday" })).toBeInTheDocument();
  });

  it("marks past days the sync hasn't reached", () => {
    renderAt("/sessions?date=2026-10-20&day=2026-10-19");
    expect(screen.getByText(/Nothing synced for this day yet/)).toBeInTheDocument();
  });

  it("explains an empty log before the plan starts", () => {
    renderAt("/sessions?date=2026-10-01");
    expect(screen.getByText(/Sessions show up here the evening they're run/)).toBeInTheDocument();
  });
});
