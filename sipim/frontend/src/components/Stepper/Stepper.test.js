import { screen, render } from "@testing-library/react";
import Stepper from "./Stepper";
import { IoCarSportOutline } from "react-icons/io5";
import { MdAttachMoney } from "react-icons/md";
import { BsFileEarmarkText } from "react-icons/bs";

export const testSteps = [
  {
    position: 1,
    icon: <IoCarSportOutline />,
    description: "Etape 1 sur 3",
    name: "Informations",
  },
  {
    position: 2,
    icon: <MdAttachMoney />,
    description: "Etape 2 sur 3",
    name: "Paiement",
  },
  {
    position: 3,
    icon: <BsFileEarmarkText />,
    description: "Etape 3 sur 3",
    name: "Reçu",
  },
];

describe("Stepper should have the correct steps active", () => {
  it("should show the correct number of steps", () => {
    render(<Stepper steps={testSteps} activeStep={1} />);
    const activeSteps = screen.getAllByTestId('step');
    expect(activeSteps.length).toBe(3);
  });

  it("should have step 1 active", () => {
    render(<Stepper steps={testSteps} activeStep={1} />);
    const activeSteps = screen.getAllByTestId('step');
    expect(activeSteps[0]).toHaveClass("step-active");
    expect(activeSteps[1]).not.toHaveClass("step-active");
    expect(activeSteps[2]).not.toHaveClass("step-active");
  });

  it("should have step 1 and 2 active", () => {
    render(<Stepper steps={testSteps} activeStep={2} />);
    const activeSteps = screen.getAllByTestId('step');
    expect(activeSteps[0]).toHaveClass("step-active");
    expect(activeSteps[1]).toHaveClass("step-active");
    expect(activeSteps[2]).not.toHaveClass("step-active");
  });

  it("should have step 1, step 2 and step 3 active", () => {
    render(<Stepper steps={testSteps} activeStep={3} />);
    const activeSteps = screen.getAllByTestId('step');
    expect(activeSteps[0]).toHaveClass("step-active");
    expect(activeSteps[1]).toHaveClass("step-active");
    expect(activeSteps[2]).toHaveClass("step-active");
  });
});
