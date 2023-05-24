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

function goToPage(page) {
  const searchInput = document.getElementById('search');
  const searchForm = document.getElementById('search-form');
  const pageInput = document.createElement('input');
  pageInput.type = 'hidden';
  pageInput.name = 'page';
  pageInput.value = page;
  searchForm.appendChild(pageInput);
  searchForm.submit();
}