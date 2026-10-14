import { useEffect, useRef } from "react";

// Remplace react-outside-click-handler (non maintenu, incompatible avec React 19).
const OutsideClickHandler = ({ onOutsideClick, children }) => {
  const ref = useRef(null);
  const callbackRef = useRef(onOutsideClick);
  callbackRef.current = onOutsideClick;

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current?.(event);
      }
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, []);

  return <div ref={ref}>{children}</div>;
};

export default OutsideClickHandler;
