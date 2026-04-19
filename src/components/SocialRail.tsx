// Floating social icons on the left edge of the page, matching the live site.
// Hidden on screens < 900px.

export default function SocialRail() {
  return (
    <div className="social-rail" aria-label="Share">
      <a href="https://www.facebook.com/tattvamag" target="_blank" rel="noreferrer noopener" aria-label="Facebook">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M9.5 22v-9H6v-3.5h3.5V7c0-3 1.8-4.7 4.5-4.7 1.3 0 2.4.1 2.7.1v3h-1.9c-1.5 0-1.8.7-1.8 1.7v2.3h3.6l-.5 3.5H13V22h-3.5z"/>
        </svg>
      </a>
      <a href="https://twitter.com/tattvamag" target="_blank" rel="noreferrer noopener" aria-label="Twitter / X">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.9 2h3.2l-7 8 8.2 12h-6.4l-5-7.3-5.8 7.3H3L10.5 13 2.6 2h6.6l4.5 6.6L18.9 2zm-1.1 18h1.8L7 3.9H5l12.8 16.1z"/>
        </svg>
      </a>
      <a href="https://wa.me/" target="_blank" rel="noreferrer noopener" aria-label="WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.4-.1-.6.1-.7 1-.9 1.1-.3.2-.6 0-1.2-.5-2.2-1.4c-.8-.7-1.4-1.6-1.5-1.9s0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.4s-.6-1.3-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.3 1 2.4c.1.2 1.6 2.4 3.9 3.4.5.2.9.3 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1s.2-.9.2-1-.2-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5l-1.4 5.1 5.3-1.4c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.2.8.8-3.1-.2-.3c-.9-1.4-1.4-3-1.4-4.6 0-4.6 3.7-8.3 8.3-8.3 2.2 0 4.3.9 5.9 2.4 1.6 1.6 2.4 3.7 2.4 5.9.3 4.6-3.4 8.6-7.9 8.6z"/>
        </svg>
      </a>
    </div>
  );
}
