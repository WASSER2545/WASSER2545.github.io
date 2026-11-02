---
layout: page
permalink: /publications/
title: Publications
years: [2026, 2025, 2024, 2023]
nav: true
nav_order: 1
---
<div class="publications">

<div class="pub-filters">
  <label class="pub-filter-label">
    <input type="checkbox" onchange="toggleFirstAuthor(this.checked)">
    First author only
  </label>
</div>

<script>
function toggleFirstAuthor(checked) {
  document.querySelectorAll('.publications ol.bibliography li').forEach(item => {
    if (!checked) {
      item.style.display = '';
      return;
    }
    const authorEl = item.querySelector('.pub-author');
    if (!authorEl) { item.style.display = 'none'; return; }
    const text = authorEl.textContent || '';
    const isFirst = text.match(/^\s*Zhengle Wang/);
    const isCoFirst = text.includes('Zhengle Wang*');
    item.style.display = (isFirst || isCoFirst) ? '' : 'none';
  });
  document.querySelectorAll('.publications h2.bibliography').forEach(heading => {
    const items = Array.from(heading.nextElementSibling.querySelectorAll('li'));
    heading.hidden = items.every(item => item.style.display === 'none');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const firstAuthorFilter = document.querySelector('.pub-filter-label input[type="checkbox"]');
  if (firstAuthorFilter) toggleFirstAuthor(firstAuthorFilter.checked);
});
</script>

{%- for y in page.years %}
  {% bibliography -f {{ site.scholar.bibliography }} -q @*[year={{y}}]* %}
{% endfor %}

</div>
