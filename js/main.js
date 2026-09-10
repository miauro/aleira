const mobile = window.matchMedia("(max-width: 720px)");

// Menú móvil
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// Scrollspy del sidebar "Descubre la casa" (solo desktop: en móvil es acordeón)
const discoverNav = document.getElementById("discoverNav");
const rooms = Array.from(document.querySelectorAll(".room"));

if (discoverNav && rooms.length) {
  const navLinksByTarget = new Map(
    Array.from(discoverNav.querySelectorAll("a")).map((link) => [
      link.getAttribute("href").slice(1),
      link,
    ])
  );

  const setActive = (id) => {
    navLinksByTarget.forEach((link) => link.classList.remove("active"));
    const activeLink = navLinksByTarget.get(id);
    if (activeLink) activeLink.classList.add("active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
  );

  rooms.forEach((room) => observer.observe(room));
  setActive(rooms[0].id);
}

// Acordeones (espacios y servicios): uno abierto a la vez, todos cerrados al entrar
const accordions = [
  {
    items: rooms,
    button: (item) => item.querySelector(".room-toggle"),
  },
  {
    items: Array.from(document.querySelectorAll(".service-group")),
    button: (item) => item.querySelector(".service-toggle"),
  },
];

accordions.forEach(({ items, button }) => {
  const setOpen = (item, open) => {
    item.toggleAttribute("data-open", open);
    button(item).setAttribute("aria-expanded", String(open));
  };

  items.forEach((item) => {
    button(item).addEventListener("click", () => {
      if (!mobile.matches) return;
      const willOpen = !item.hasAttribute("data-open");
      items.forEach((other) => setOpen(other, false));
      setOpen(item, willOpen);
      if (willOpen) {
        item.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // En desktop el contenido siempre está visible, así que aria-expanded
  // debe reflejarlo aunque el acordeón no se use.
  const syncToViewport = () => {
    items.forEach((item) => {
      if (mobile.matches) setOpen(item, item.hasAttribute("data-open"));
      else button(item).setAttribute("aria-expanded", "true");
    });
  };

  syncToViewport();
  mobile.addEventListener("change", syncToViewport);
});

// Lightbox: una sola galería continua, encadenando un espacio con el siguiente
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxRoom = document.getElementById("lightboxRoom");
  const lightboxCount = document.getElementById("lightboxCount");
  const floatingCta = document.getElementById("floatingCta");

  const photos = [];
  document.querySelectorAll(".room-grid").forEach((grid) => {
    const name = grid.closest(".room").querySelector("h3").textContent;
    const images = Array.from(grid.querySelectorAll("img"));
    const base = photos.length;
    images.forEach((img, i) => {
      img.addEventListener("click", () => open(base + i));
      photos.push({ src: img.src, alt: img.alt, room: name, position: i + 1, total: images.length });
    });
  });

  let index = 0;

  const render = () => {
    const photo = photos[index];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
    lightboxRoom.textContent = photo.room;
    lightboxCount.textContent = `${photo.position} / ${photo.total}`;
  };

  function open(startIndex) {
    index = startIndex;
    render();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    if (floatingCta) floatingCta.classList.remove("visible");
  }

  const close = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    if (floatingCta) floatingCta.dispatchEvent(new Event("recheck"));
  };

  const step = (delta) => {
    index = (index + delta + photos.length) % photos.length;
    render();
  };

  document.getElementById("lightboxClose").addEventListener("click", close);
  document.getElementById("lightboxPrev").addEventListener("click", () => step(-1));
  document.getElementById("lightboxNext").addEventListener("click", () => step(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });
}

// CTA flotante: aparece al pasar el hero, se esconde con el lightbox abierto
const floatingCta = document.getElementById("floatingCta");
const hero = document.querySelector(".hero");

if (floatingCta && hero) {
  let heroPassed = false;

  const update = () => {
    const hidden = !heroPassed || document.getElementById("lightbox").classList.contains("open");
    floatingCta.classList.toggle("visible", !hidden);
  };

  new IntersectionObserver(
    ([entry]) => {
      heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    },
    { threshold: 0 }
  ).observe(hero);

  floatingCta.addEventListener("recheck", update);
}
