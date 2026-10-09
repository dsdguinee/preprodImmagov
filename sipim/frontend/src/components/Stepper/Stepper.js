const Stepper = ({ steps, activeStep }) => {
  return (
    <div className="stepper">
      {steps.map(step => (
        <div key={step.position} className={`step ${step.position <= activeStep  && "step-active"}`} data-testid={`step`}>
          <div className="step-icon">
            {step.icon}
          </div>
          <div className="step-info">
            <span>{step.description}</span>
            <strong>{step.name}</strong>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Stepper