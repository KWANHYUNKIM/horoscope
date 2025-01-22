import React, { useState } from "react";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    alert(`검색어: ${searchTerm}`);
    // 검색 기능 추가
    setSearchTerm(""); // 검색 후 입력 초기화
  };

  return (
    <header style={styles.header}>
      <h1 style={styles.title}>삐뽀삐뽀119</h1>

      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="무엇을 찾으시나요?"
          style={styles.searchInput}
        />
        <button onClick={handleSearch} style={styles.searchButton}>
          검색
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "#ff6b6b",
    color: "white",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  searchInput: {
    width: "300px",
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  searchButton: {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#ff4757",
    color: "white",
    cursor: "pointer",
  },
};

export default Header;
