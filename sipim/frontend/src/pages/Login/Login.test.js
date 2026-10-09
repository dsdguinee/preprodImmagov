import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import Login from "./Login";

beforeEach(() => {
  render(
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
});

describe("Login page", () => {
  describe("Login form layout", () => { 
    it("should render the header", () => {
      const header = screen.getByRole("heading", { name: /Connexion/i });
      expect(header).toBeInTheDocument();
    });

    it("should render the email or telephone field", () => {
        const login = screen.getByRole('textbox', { name: /Email ou téléphone/i });
        expect(login).toBeInTheDocument();
    });

    it("should render the password field", () => {
        const password = screen.getByLabelText(/Mot de passe/i);
        expect(password).toBeInTheDocument();
    })

    it("should render the login button", () => {
        const button = screen.getByRole('button', { name: /Connexion/i });
        expect(button).toBeInTheDocument(); 
    })
  });

  describe("Inputs reactions to user actions", () => {
    it("should match the user input", () => {
        const login = screen.getByRole("textbox", { name: /Email ou téléphone/i })
        userEvent.type(login, 'Aboubacar')
        expect(login.value).toBe("Aboubacar")
    })

    it("should match the user input", () => {
        const password = screen.getByLabelText(/mot de passe/i)
        userEvent.type(password, "123456")
        expect(password.value).toBe("123456")
    })

    it("should show an error message if email or telephone is empty", async () => {
        const login = screen.getByRole("textbox", { name: /Email ou téléphone/i })
        const button = screen.getByRole('button', { name: /Connexion/i });
        fireEvent.change(login, { value: ""})
        userEvent.click(button)
        expect(await screen.findByText(/L'email ou le numéro de téléphone est obligatoire/i)).toBeInTheDocument();
    })

    it("should show an error message if password field is empty", async () => {
        const password = screen.getByLabelText(/Mot de passe/i)
        const button = screen.getByRole('button', { name: /Connexion/i });
        fireEvent.change(password, { value: ""})
        userEvent.click(button)
        expect(await screen.findByText(/Le mot de passe est obligatoire/i)).toBeInTheDocument();
    })
  })
});
