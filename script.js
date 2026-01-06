const albumsRow = document.getElementById("albumsRow");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const noResults = document.getElementById("noResults");
const backToTop = document.getElementById("backToTop");

const modalElement = document.getElementById("tracklistModal");
const modalTitle = document.getElementById("modalTitle");
const tracklistContainer = document.getElementById("tracklist");
const trackStats = document.getElementById("trackStats");
const playSpotifyBtn = document.getElementById("playSpotify");

const modal = new bootstrap.Modal(modalElement);

let albums = [];
let originalAlbums = [];

fetch("library.json")
  .then(res => res.json())
  .then(data => {
    albums = data;
    originalAlbums = [...data];
    renderAlbums(albums);
  });

function renderAlbums(list) {
  albumsRow.innerHTML = "";

  if (list.length === 0) {
    noResults.classList.remove("d-none");
    return;
  }

  noResults.classList.add("d-none");

  list.forEach(album => {
    const col = document.createElement("div");
    col.className = "col-xl-2 col-md-3 col-sm-6 col-12";

    col.innerHTML = `
      <div class="card h-100 album-card">
        <div class="position-relative">
          <img src="img/${album.thumbnail}" class="card-img-top album-img">
          <div class="album-overlay">${album.album}</div>
        </div>

        <div class="card-body">
          <h5 class="card-title">${album.artist}</h5>
        </div>

        <div class="card-footer d-flex justify-content-between">
          <small class="text-secondary">${album.tracklist.length} tracks</small>
          <button class="btn btn-warning btn-sm view-btn" data-id="${album.id}">
            View
          </button>
        </div>
      </div>
    `;

    albumsRow.appendChild(col);
  });
}

function applyFilters() {
  let list = [...originalAlbums];

  const q = searchInput.value.toLowerCase();
  if (q) {
    list = list.filter(a =>
      a.artist.toLowerCase().includes(q) ||
      a.album.toLowerCase().includes(q)
    );
  }

  const v = sortSelect.value;
  if (v === "artist") list.sort((a, b) => a.artist.localeCompare(b.artist));
  if (v === "album") list.sort((a, b) => a.album.localeCompare(b.album));
  if (v === "tracksAsc") list.sort((a, b) => a.tracklist.length - b.tracklist.length);
  if (v === "tracksDesc") list.sort((a, b) => b.tracklist.length - a.tracklist.length);

  renderAlbums(list);
}

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);

/* TIME HELPERS */
function durationToSeconds(t) {
  const [m, s] = t.split(":").map(Number);
  return m * 60 + s;
}

function secToTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".view-btn");
  if (!btn) return;

  const album = originalAlbums.find(a => a.id == btn.dataset.id);
  showAlbumModal(album);
});

function showAlbumModal(album) {
  modalTitle.textContent = `${album.artist} — ${album.album}`;
  tracklistContainer.innerHTML = "";

  let totalSeconds = 0;
  let longest = album.tracklist[0];
  let shortest = album.tracklist[0];

  album.tracklist.forEach(track => {
    const secs = durationToSeconds(track.trackLength);
    totalSeconds += secs;

    if (secs > durationToSeconds(longest.trackLength)) longest = track;
    if (secs < durationToSeconds(shortest.trackLength)) shortest = track;

    tracklistContainer.innerHTML += `
      <li class="list-group-item d-flex justify-content-between">
        <div>
          <strong>${track.number}. </strong>
          <a href="${track.url}" target="_blank"
             class="text-warning text-decoration-none">
            ${track.title}
          </a>
        </div>
        <span>${track.trackLength}</span>
      </li>
    `;
  });

  const avg = Math.floor(totalSeconds / album.tracklist.length);

  trackStats.innerHTML = `
    <strong>Total tracks:</strong> ${album.tracklist.length}<br>
    <strong>Total duration:</strong> ${secToTime(totalSeconds)}<br>
    <strong>Average track:</strong> ${secToTime(avg)}<br>
    <strong>Longest:</strong> ${longest.title} (${longest.trackLength})<br>
    <strong>Shortest:</strong> ${shortest.title} (${shortest.trackLength})
  `;

  playSpotifyBtn.href = album.tracklist[0].url;

  modal.show();
}

window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 250 ? "block" : "none";
});

backToTop.onclick = () =>
  window.scrollTo({ top: 0, behavior: "smooth" });
