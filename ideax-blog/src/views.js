import { esc } from './html.js'
import { readingTime, renderMarkdown } from './markdown.js'

export const site = {
  name: 'ideax',
  email: 'hello@yourdomain.com', // TODO: your real email
}

const formatDate = (sqlDate) =>
  sqlDate
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(sqlDate.replace(' ', 'T') + 'Z'),
      )
    : ''

const tints = ['tint-purple', 'tint-yellow', 'tint-green', 'tint-orange']

// ---------- shared layout ----------

function layout({ title, description = '', body, admin = false, dark = false }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${admin ? '<meta name="robots" content="noindex">' : ''}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://api.fontshare.com">
  <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=3_nav">
  ${admin ? '' : '<script src="/nav.js?v=1" defer></script>'}
</head>
<body class="${dark ? 'dark' : ''}">
${admin ? '' : header()}
${body}
${admin ? '' : footer()}
</body>
</html>`
}

// Same navbar as the main Ideaxcorp site: a dark bar of links that shrinks into the eyes pill on
// scroll and opens again on hover or tap (public/nav.js). Links go to the main site's pages.
function header() {
  return `<header class="site-header">
  <div class="menu">
    <div class="menu-eyes" aria-hidden="true"><span><i></i></span><span><i></i></span></div>
    <nav aria-label="Main">
      <a href="/">Home</a><a href="/about/">About</a><a href="/services/">Services</a><a href="/portfolio/">Portfolio</a><a href="/blog" aria-current="page">Blog</a><a href="/contact/">Contact</a>
    </nav>
  </div>
</header>`
}

function footer() {
  return `<footer class="site-footer" id="contact">
  <div class="footer-contact">
    <p>We are in our studio!<br>Contact us here:</p>
    <a href="mailto:${esc(site.email)}" class="footer-link">${esc(site.email)}</a>
  </div>
  <p class="footer-mark" aria-hidden="true">${esc(site.name)}</p>
  <div class="footer-bottom">
    <span>${new Date().getFullYear()} Ideax. All rights reserved.</span>
    <a href="/admin">Admin</a>
  </div>
</footer>`
}

const eyes = `<span class="eyes" aria-hidden="true"><span><i></i></span><span><i></i></span></span>`

// ---------- public pages ----------

function postCard(p, i) {
  return `<a class="card" href="/blog/${esc(p.slug)}">
    <div class="card-media ${tints[i % tints.length]}">
      ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : eyes}
    </div>
    <div class="card-body">
      <p class="meta">${formatDate(p.published_at)} · ${readingTime(p.content)} min read</p>
      <h3>${esc(p.title)}</h3>
      ${p.excerpt ? `<p class="excerpt">${esc(p.excerpt)}</p>` : ''}
    </div>
  </a>`
}

export function blogIndex(list) {
  return layout({
    title: 'Blog | Ideax',
    description: 'Stories, ideas and behind-the-scenes from the Ideax studio.',
    body: `<main>
  <section class="blog-hero">
    <p class="arc">The Ideax</p>
    <h1>Blog</h1>
    <p class="lead">Stories, ideas and behind-the-scenes from our studio.</p>
  </section>
  <section class="cards">
    ${list.length ? list.map(postCard).join('') : `<p class="empty">No posts yet. Check back soon!</p>`}
  </section>
</main>`,
  })
}

export function blogPost(p, more) {
  return layout({
    title: `${p.title} | Ideax`,
    description: p.excerpt,
    body: `<main>
  <article class="post">
    <a href="/blog" class="back">← All posts</a>
    <p class="meta">${formatDate(p.published_at)} · ${readingTime(p.content)} min read</p>
    <h1>${esc(p.title)}</h1>
    ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
    ${p.cover ? `<img class="post-cover" src="${esc(p.cover)}" alt="">` : ''}
    <div class="prose">${renderMarkdown(p.content)}</div>
  </article>
  ${
    more.length
      ? `<section class="more"><h2>Keep reading</h2><div class="cards">${more.map(postCard).join('')}</div></section>`
      : ''
  }
</main>`,
  })
}

export function notFound() {
  return layout({
    title: 'Not found | Ideax',
    body: `<main class="blog-hero"><h1>Oops.</h1><p class="lead">We couldn't find that page.</p><p><a class="btn outline-dark" href="/blog">Back to the blog</a></p></main>`,
  })
}

// ---------- admin pages ----------

const csrfField = (csrf) => `<input type="hidden" name="_csrf" value="${esc(csrf)}">`

function adminShell(user, csrf, content) {
  return `<div class="admin">
  <aside class="admin-bar">
    <a href="/admin" class="logo">${esc(site.name)}<span>admin</span></a>
    <nav>
      <a href="/admin">All posts</a>
      <a href="/admin/posts/new">New post</a>
      <a href="/blog" target="_blank">View blog ↗</a>
    </nav>
    <form method="post" action="/admin/logout" class="logout">
      ${csrfField(csrf)}
      <p>${esc(user.email)}</p>
      <button class="btn outline">Log out</button>
    </form>
  </aside>
  <main class="admin-main">${content}</main>
</div>`
}

export function loginPage({ error = '', email = '' } = {}) {
  return layout({
    title: 'Admin login | Ideax',
    admin: true,
    dark: true,
    body: `<main class="login">
  <form method="post" action="/admin/login" class="login-card">
    ${eyes}
    <h1>Howdy, admin</h1>
    ${error ? `<p class="error">${esc(error)}</p>` : ''}
    <label>Email<input type="email" name="email" value="${esc(email)}" required autofocus autocomplete="username"></label>
    <label>Password<input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn yellow wide">Log in</button>
    <a href="/blog" class="back">← Back to the blog</a>
  </form>
</main>`,
  })
}

export function dashboard(user, csrf, list, flash = '') {
  const rows = list
    .map(
      (p) => `<tr>
    <td><a href="/admin/posts/${p.id}/edit" class="title-link">${esc(p.title)}</a><span class="slug">/blog/${esc(p.slug)}</span></td>
    <td><span class="badge ${p.status}">${p.status === 'published' ? 'Published' : 'Draft'}</span></td>
    <td>${formatDate(p.updated_at)}</td>
    <td class="actions">
      ${p.status === 'published' ? `<a href="/blog/${esc(p.slug)}" target="_blank">View</a>` : ''}
      <a href="/admin/posts/${p.id}/edit">Edit</a>
      <form method="post" action="/admin/posts/${p.id}/delete" data-confirm="Delete “${esc(p.title)}”? This cannot be undone." onsubmit="return confirm(this.dataset.confirm)">
        ${csrfField(csrf)}<button class="link danger">Delete</button>
      </form>
    </td>
  </tr>`,
    )
    .join('')

  return layout({
    title: 'Posts | Ideax admin',
    admin: true,
    body: adminShell(
      user,
      csrf,
      `<div class="admin-head">
        <h1>Posts</h1>
        <a href="/admin/posts/new" class="btn yellow">+ New post</a>
      </div>
      ${flash ? `<p class="flash">${esc(flash)}</p>` : ''}
      ${
        list.length
          ? `<table class="post-table"><thead><tr><th>Title</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
          : `<div class="empty-state">${eyes}<p>No posts yet.</p><a href="/admin/posts/new" class="btn yellow">Write your first post</a></div>`
      }`,
    ),
  })
}

export function editor(user, csrf, post = null, error = '') {
  const p = post ?? { title: '', excerpt: '', content: '', status: 'draft', cover: null }
  const action = post?.id ? `/admin/posts/${post.id}` : '/admin/posts'

  return layout({
    title: `${post?.id ? 'Edit' : 'New'} post | Ideax admin`,
    admin: true,
    body: adminShell(
      user,
      csrf,
      `<div class="admin-head">
        <h1>${post?.id ? 'Edit post' : 'New post'}</h1>
        <a href="/admin" class="back">← All posts</a>
      </div>
      ${error ? `<p class="error">${esc(error)}</p>` : ''}
      <form method="post" action="${action}" enctype="multipart/form-data" class="editor">
        ${csrfField(csrf)}
        <div class="editor-main">
          <label>Title<input name="title" value="${esc(p.title)}" required maxlength="160" placeholder="A catchy title"></label>
          <label>Short summary <small>(shown on the blog page)</small>
            <textarea name="excerpt" rows="2" maxlength="300" placeholder="One or two sentences">${esc(p.excerpt)}</textarea>
          </label>
          <label>Content <small>(Markdown: **bold**, *italic*, ## Heading, - list, [link](https://…))</small>
            <textarea name="content" rows="20" class="mono" placeholder="Write your post here…">${esc(p.content)}</textarea>
          </label>
        </div>
        <div class="editor-side">
          <div class="panel">
            <h3>Publish</h3>
            <label class="radio"><input type="radio" name="status" value="draft" ${p.status !== 'published' ? 'checked' : ''}> Draft (only you can see it)</label>
            <label class="radio"><input type="radio" name="status" value="published" ${p.status === 'published' ? 'checked' : ''}> Published</label>
            <button class="btn yellow wide">Save</button>
          </div>
          <div class="panel">
            <h3>Cover image</h3>
            ${
              p.cover
                ? `<img src="${esc(p.cover)}" alt="" class="cover-preview">
                   <label class="radio"><input type="checkbox" name="remove_cover" value="1"> Remove this image</label>`
                : ''
            }
            <input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/gif">
            <small>JPG, PNG, WebP or GIF, up to 5 MB.</small>
          </div>
        </div>
      </form>`,
    ),
  })
}
