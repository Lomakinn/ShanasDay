(() => {
  const grid = document.getElementById('motivationGrid');
  if (!grid) return;
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= 50; i++) {
    const fig = document.createElement('figure');
    fig.className = 'm-card';
    const img = document.createElement('img');
    img.className = 'm-card__svg';
    img.loading = 'lazy';
    const name = String(i).padStart(3,'0');
    img.src = `assets/motivations/motivation-${name}.svg`;
    img.alt = `Мотивация ${i}`;
    fig.appendChild(img);
    frag.appendChild(fig);
  }
  grid.appendChild(frag);
})();

