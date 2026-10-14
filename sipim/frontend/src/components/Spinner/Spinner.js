import { loadingState, useAtomValue } from "../../store/atoms";

const Spinner = () => {
  const isLoading = useAtomValue(loadingState);

  return (
    <>
      {isLoading ? (
        <div className="spinner-wrapper">
          <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Spinner;
