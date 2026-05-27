---
layout: page
permalink: /blog/
title: 
description:
---

<ul class="post-list">
{% for post in site.posts %}
  <li>
    <div class="post-list-item">
      <div class="post-list-text">
        <h3>
          <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </h3>
        <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</p>
        <p>{{ post.description }}</p>
        {% if post.tags %}
        <p class="post-tags">
          {% for tag in post.tags %}
          <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}"><i class="fas fa-hashtag fa-sm"></i> {{ tag }}</a>&nbsp;
          {% endfor %}
        </p>
        {% endif %}
      </div>
      {% if post.image %}
      <a class="post-list-image" href="{{ post.url | relative_url }}">
        <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
      </a>
      {% endif %}
    </div>
  </li>
{% endfor %}
</ul>
