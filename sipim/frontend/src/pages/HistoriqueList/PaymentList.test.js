import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { ElementContext, UserContext } from "../../services/Context/Context";
import PaymentList from "./PaymentList";

const user = "";
const userRole = "";
const agence = "";
const decoupage = "";
const elementsData = {
  categories: [
    {
      categorie_id: "1",
      nomCategorie: "1",
    },
  ],
  typeCarteGrise: [
    {
      categorie_id: "2",
      type: "CarteGrise",
    },
  ],
  typeVignette: [
    {
      typecg_id: "2",
      type: "CarteGrise",
    },
  ],
  autorisations: [
    {
      categorie_id: "2",
      type: "CarteGrise",
    },
  ],
};

beforeEach(() => {
  render(
    <RecoilRoot>
    <UserContext.Provider value={{ user, userRole, agence, decoupage }}>
      <ElementContext.Provider value={{ elementsData }}>
        <BrowserRouter>
          <PaymentList />;
        </BrowserRouter>
      </ElementContext.Provider>
    </UserContext.Provider>
    </RecoilRoot>
  );
});

describe("Layout", () => {
  it("should show the header", () => {
    const header = screen.getByRole("heading", {name: /Liste des paiements/i});
    expect(header).toBeInTheDocument();
  });

  it("should mock the api response and show the referenceNum from the mock", async () => {
    const numRef = await screen.findByText(/IZCPYORXVM62512729/i);
    expect(numRef).toBeInTheDocument();
  })
});
