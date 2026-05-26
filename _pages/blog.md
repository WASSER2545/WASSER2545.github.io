---
layout: page
permalink: /blog/
title: Notes
description: Research notes and reading logs.
nav: true
nav_order: 4
---

<ul class="post-list">
{% for post in site.posts %}
  <li>
    <h3>
      <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>
    <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</p>
    {% if post.tags %}
    <p class="post-tags">
      {% for tag in post.tags %}
      <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}"><i class="fas fa-hashtag fa-sm"></i> {{ tag }}</a>&nbsp;
      {% endfor %}
    </p>
    {% endif %}
    <p>{{ post.description }}</p>
  </li>
{% endfor %}
</ul>
