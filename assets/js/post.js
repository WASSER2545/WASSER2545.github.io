// Keep the same section links in a desktop sidebar and a mobile disclosure.
const articleContents = document.querySelector('.article-toc details');
if (articleContents) {
  const desktopArticle = window.matchMedia('(min-width: 1024px)');
  articleContents.open = desktopArticle.matches;
  desktopArticle.addEventListener('change', event => {
    articleContents.open = event.matches;
  });
}

// Wide tables scroll within the article, leaving the reading column in place.
document.querySelectorAll('.blog-article #markdown-content table').forEach(table => {
  const wrapper = document.createElement('div');
  wrapper.className = 'article-table';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'Article table');
  table.before(wrapper);
  wrapper.append(table);
});
