import { useRecoilValue } from "recoil";
import { loadingState } from "../../recoil/atoms/loadingAtom";

const Spinner = () => {
  const isLoading = useRecoilValue(loadingState);

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
