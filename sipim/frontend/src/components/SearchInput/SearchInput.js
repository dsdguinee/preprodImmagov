import { FiSearch } from 'react-icons/fi'

const SearchInput = () => {
  return (
    <>
      <label>
        Recherche
        <div className="search-field">
          <input type="text" placeholder="Chercher" />
          <div className="search-icon">
            <FiSearch />
          </div>
        </div>
      </label>
    </>
  );
};

export default SearchInput;
