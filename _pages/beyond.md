---
layout: default
title: Beyond Research
permalink: /beyond/
nav: true
nav_order: 2
description: A listening room for progressive rock and jazz fusion.
---

<article class="listening-room">
  <header class="listening-hero">
    <div class="listening-intro">
      <p class="listening-eyebrow">Beyond Research / Music</p>
      <h1>In a different<br>time signature.</h1>
      <p class="listening-lead">Outside research, I love progressive rock and jazz fusion.</p>
      <p class="listening-description">Long forms, unexpected turns, and room to improvise. A small corner of my website for the music I love.</p>
      <nav class="listening-sides" aria-label="Explore the music">
        <a href="#progressive-rock"><span>Side A</span> Progressive rock <span aria-hidden="true">↘</span></a>
        <a href="#jazz-fusion"><span>Side B</span> Jazz fusion <span aria-hidden="true">↘</span></a>
      </nav>
    </div>
    <figure class="listening-art">
      <img src="{{ '/assets/img/beyond/listening-room.svg' | relative_url }}" alt="An illustrated record sleeve with flowing teal and ochre lines, beside a vinyl record" width="560" height="560">
      <figcaption>Two sides. Many directions.</figcaption>
    </figure>
  </header>

  <div class="listening-divider"><span>Notes from the listening room</span><span aria-hidden="true">33⅓ RPM</span></div>

  <section class="music-side" id="progressive-rock" aria-labelledby="prog-heading">
    <div class="music-side-label"><span>A</span><p>Composition<br>& exploration</p></div>
    <div class="music-side-content">
      <p class="listening-eyebrow">Side A</p>
      <h2 id="prog-heading">Progressive rock</h2>
      <p class="music-side-intro">Music with somewhere to go.</p>
      <p class="music-side-description">Extended compositions, shifting rhythms, and themes that return in a different light. Here are a few of my favorite records, from Yes and Pink Floyd to King Crimson, Camel, and Genesis.</p>
    </div>
    <div class="record-collection">
      <div class="record-shelf-heading">
        <h3>On my record shelf</h3>
        <span>{{ site.data.records | size }} albums · Open a cover to explore ↗</span>
      </div>
      <ul class="record-shelf">
        {% for record in site.data.records %}
        <li>
          <a class="record" href="{{ record.url }}" target="_blank" rel="noopener noreferrer" aria-label="{{ record.title | escape }} by {{ record.artist | escape }} (opens in a new tab)">
            <div class="record-cover">
              <img src="{{ record.cover | prepend: '/assets/img/beyond/albums/' | relative_url }}" alt="" width="600" height="600" loading="lazy" decoding="async">
              <span class="record-open" aria-hidden="true">↗</span>
            </div>
            <span class="record-artist">{{ record.artist }} <span>{{ record.year }}</span></span>
            <span class="record-title">{{ record.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
      <p class="record-credit">Album artwork © respective rights holders. Album links lead to Apple Music or the artist’s official site.</p>
    </div>
  </section>

  <section class="music-side fusion-side" id="jazz-fusion" aria-labelledby="fusion-heading">
    <div class="music-side-label"><span>B</span><p>Improvisation<br>& conversation</p></div>
    <div class="music-side-content">
      <p class="listening-eyebrow">Side B</p>
      <h2 id="fusion-heading">Jazz fusion</h2>
      <p class="music-side-intro">A conversation in motion.</p>
      <p class="music-side-description">Electric textures, rhythmic interplay, and the freedom of improvisation. The interest is in the exchange: how one musical idea makes room for the next.</p>
      <div class="fusion-favorite">
        <a class="record" href="https://music.apple.com/us/album/romantic-warrior/168375057" target="_blank" rel="noopener noreferrer" aria-label="Romantic Warrior by Return to Forever (opens in a new tab)">
          <div class="record-cover">
            <img src="{{ '/assets/img/beyond/albums/romantic-warrior.jpg' | relative_url }}" alt="" width="600" height="600" loading="lazy" decoding="async">
            <span class="record-open" aria-hidden="true">↗</span>
          </div>
        </a>
        <div class="fusion-details">
          <p class="listening-eyebrow">A favorite on this side</p>
          <h3>Romantic Warrior</h3>
          <p class="fusion-artist">Return to Forever <span>· 1976</span></p>
          <a href="https://music.apple.com/us/album/romantic-warrior/168375057" target="_blank" rel="noopener noreferrer">Listen on Apple Music <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
          <a href="https://chickcorea.com/bio/1972-78/" target="_blank" rel="noopener noreferrer">Explore the band <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
        </div>
      </div>
    </div>
  </section>

  <footer class="listening-note">
    <p>Always happy to talk music.</p>
    <a href="mailto:wang7690@purdue.edu?subject=Music%20recommendation">Send me something to listen to <span aria-hidden="true">↗</span></a>
  </footer>
</article>
