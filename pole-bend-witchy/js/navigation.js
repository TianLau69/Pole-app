(function () {
  const path = window.location.pathname.replace(/\\/g, "/");
  const inPlaylists = path.includes("/pole-playlists/");
  const file = path.split("/").pop() || "index.html";

  let active = "home";

  if (file === "gestion.html" || file === "programme.html") {
    active = "exercices";
  }

  if (file === "figures.html") {
    active = "figures";
  }

  if (file === "playlists.html") {
    active = "playlists";
  }

  const root = inPlaylists ? "../" : "";

  const style = document.createElement("style");

  style.textContent = `
    body {
      padding-bottom: 78px !important;
    }

    .siteBottomNav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      background: rgba(9, 8, 9, 0.96);
      border-top: 1px solid #34252b;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .siteBottomNavInner {
      max-width: 620px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 8px 10px 10px;
    }

    .siteBottomNav button {
      appearance: none;
      -webkit-appearance: none;
      border: 0;
      background: transparent;
      color: #75696b;
      font: inherit;
      font-size: 11px;
      line-height: 1.2;
      min-height: 42px;
      padding: 7px 4px;
      border-radius: 10px;
      cursor: pointer;
    }

    .siteBottomNav button.active {
      color: #f6eee8;
      background: #a3133d;
    }

    .siteBottomNav button:focus {
      outline: none;
    }

    .siteBottomNav button:focus-visible {
      outline: 2px solid #cf315d;
      outline-offset: 2px;
    }
  `;

  document.head.appendChild(style);

  const nav = document.createElement("nav");

  nav.className = "siteBottomNav";
  nav.setAttribute("aria-label", "Navigation principale");

  nav.innerHTML = `
    <div class="siteBottomNavInner">

      <button
        class="${active === "home" ? "active" : ""}"
        type="button"
        onclick="location.href='${root}index.html'">
        Accueil
      </button>

      <button
        class="${active === "exercices" ? "active" : ""}"
        type="button"
        onclick="location.href='${root}gestion.html'">
        Exercices
      </button>

      <button
        class="${active === "figures" ? "active" : ""}"
        type="button"
        onclick="location.href='${root}figures.html'">
        Figures
      </button>

      <button
        class="${active === "playlists" ? "active" : ""}"
        type="button"
        onclick="location.href='${root}pole-playlists/playlists.html'">
        Playlists
      </button>

    </div>
  `;

  document.body.appendChild(nav);
})();
