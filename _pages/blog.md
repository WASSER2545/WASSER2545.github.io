---
layout: page
permalink: /blog/
title: 
description:
---

<ul class="post-list">
{% for post in site.posts %}
  <li>
    {% if post.image %}
    <a class="post-preview-link" href="{{ post.url | relative_url }}" aria-label="{{ post.title }}">
      <img class="post-preview-thumb" src="{{ post.image | relative_url }}" alt="{{ post.title }} preview image">
    </a>
    {% endif %}
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
