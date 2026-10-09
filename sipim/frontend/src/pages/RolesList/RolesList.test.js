import { screen, render } from "@testing-library/react";
import RolesList from "./RolesList";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";

beforeEach(() => {
  render(
    <RecoilRoot>
      <BrowserRouter>
        <RolesList />
      </BrowserRouter>
    </RecoilRoot>
  );
});

describe("layout", () => {
  it("should render the header", () => {
    const header = screen.getByRole("heading", { name: /Roles/i });
    expect(header).toBeInTheDocument();
  });

  it("should show the add new button", () => {
    const button = screen.getByRole("button", { name: /Nouveau role/i });
    expect(button).toBeInTheDocument();
  });

  describe("actions", () => {
    it("should show the add new modal on click", async () => {
      const button = screen.getByRole("button", { name: /Nouveau role/i });
      userEvent.click(button);

      const modalHeading = await screen.findByRole("heading", {
        name: /Ajouter un nouveau role/i,
      });
      expect(modalHeading).toBeInTheDocument();
    });
  });
});
