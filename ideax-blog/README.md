# Ideax blog

A small blog with an admin area for writing posts. Node.js + Express, with posts
stored in a SQLite database file (`data/blog.db`). Needs Node.js 22.13 or newer.

## Run it

    npm install
    npm run create-admin -- you@example.com "a long password"
    npm start

- Blog: http://localhost:4000/blog
- Admin: http://localhost:4000/admin

Use `npm run dev` instead of `npm start` to restart automatically when you edit code.
Set a different port with the `PORT` environment variable.

## Writing posts

Log in at `/admin`, click **New post**, fill in the title, a short summary and the
content, optionally add a cover image, choose **Draft** or **Published**, and save.

Content is written in Markdown:

    ## A heading
    **bold**, *italic*, [a link](https://example.com)
    - a list item
    > a quote
    ![an image](https://example.com/picture.jpg)

A post's web address comes from its title. While it is a draft the address follows
the title; once published it stays fixed so shared links keep working.

## Admin accounts

- Add another admin, or reset a forgotten password, with the same command:
  `npm run create-admin -- you@example.com "new password"`
  (resetting signs that account out everywhere).
- After 5 wrong passwords, logins from that IP address are paused for 15 minutes.

## Going live

1. Set `NODE_ENV=production` so the login cookie is only sent over HTTPS.
2. Serve the site over HTTPS (most Node hosts do this for you).
3. Keep `data/` and `uploads/` on persistent storage, and back them up. They hold
   every post and image.
4. Change the email in `src/views.js` (`site.email`).

## Files

- `server.js`: routes for the blog and admin
- `src/db.js`: database tables and post queries
- `src/auth.js`: passwords, login sessions, form protection
- `src/views.js`: the HTML for every page
- `src/markdown.js`: turns post content into HTML safely
- `public/styles.css`: all styling (colours at the top)
