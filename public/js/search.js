function populateSearch(tag) {
    const searchInput = document.getElementById('search');
    searchInput.value = tag;
    const searchForm = document.getElementById('search-form');
    searchForm.submit();
  }

  const searchQuery = '<%= searchQuery %>';
  const searchSection = document.getElementById('search-section');
  if (!searchQuery) {
    searchSection.style.display = 'none';
  }