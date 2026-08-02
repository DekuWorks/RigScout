import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SimpleMarkdown } from "./simple-markdown";

function renderMd(source: string) {
  return render(
    <MemoryRouter>
      <SimpleMarkdown source={source} />
    </MemoryRouter>,
  );
}

describe("SimpleMarkdown", () => {
  it("renders headings, lists, and emphasis", () => {
    renderMd(`# Title

## Section

A paragraph with **bold** and *italic* and \`code\`.

- One
- Two
`);
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("uses router links for internal paths and rejects unsafe schemes", () => {
    renderMd(`Read [Discover](/app/discover) and [bad](javascript:alert(1)).`);
    const discover = screen.getByRole("link", { name: "Discover" });
    expect(discover).toHaveAttribute("href", "/app/discover");
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
    expect(screen.getByText("bad")).toBeInTheDocument();
  });
});
