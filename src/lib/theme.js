/* Palette: nero + verde, max 6 valori
   Contrasti su #000:  text 15.4:1 · muted 5.9:1 · green 9.2:1 · danger 5.6:1 */
export const C = {
  bg:       "#000000",
  card:     "#0d0d0d",
  hover:    "#161616",
  green:    "#22c55e",
  greenDim: "#071a0e",
  text:     "#ebebeb",
  muted:    "#888888",
  border:   "#1e1e1e",
  danger:   "#ef4444",
};

const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#000;overflow-x:hidden;overscroll-behavior-y:none}

.gz-grid{display:grid;gap:10px;grid-template-columns:1fr}
@media(min-width:480px){.gz-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.gz-grid{grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}}

.gz-card{display:flex;flex-direction:row;background:#0d0d0d;border-radius:8px;overflow:hidden;text-decoration:none;transition:border-color .15s,transform .15s}
@media(min-width:900px){.gz-card{flex-direction:column}}
@media(hover:hover){.gz-card:hover{border-color:#22c55e!important;transform:translateY(-2px)}}

.gz-card-img{width:92px;height:92px;object-fit:cover;object-position:top center;flex-shrink:0;align-self:flex-start;margin-top:11px}
@media(min-width:900px){.gz-card-img{width:100%;height:auto;aspect-ratio:16/9;align-self:auto;margin-top:0;object-position:center}}

.gz-card-stripe{width:3px;flex-shrink:0;align-self:stretch}
@media(min-width:900px){.gz-card-stripe{width:100%;height:2px;align-self:auto}}

.gz-card-body{padding:11px 13px;display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}
@media(min-width:900px){.gz-card-body{padding:14px 16px 16px;gap:9px}}

.gz-card-title{margin:0;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#ebebeb;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(min-width:900px){.gz-card-title{font-size:18px;-webkit-line-clamp:3}}

.gz-card-desc{margin:0;font-family:'Crimson Pro',serif;font-size:14px;color:#aaaaaa;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(min-width:900px){.gz-card-desc{font-size:16px;line-height:1.65;-webkit-line-clamp:3}}

.gz-aside{position:fixed;inset:0;z-index:200;overflow-y:auto;background:#000;border-right:none}
@media(min-width:640px){.gz-aside{position:sticky;inset:auto;top:0;width:310px;flex-shrink:0;max-height:100vh;z-index:10;background:#0d0d0d;border-right:1px solid #1e1e1e}}

.gz-date{display:none}
@media(min-width:480px){.gz-date{display:inline}}

input:focus,textarea:focus{outline:none;border-color:#22c55e!important}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
@keyframes gzp{0%,100%{transform:scale(.8);opacity:.3}50%{transform:scale(1.3);opacity:1}}
`;

export function injectTheme() {
  if (!document.getElementById("gz-global")) {
    const s = document.createElement("style");
    s.id = "gz-global";
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
  }
  if (!document.getElementById("gz-fonts")) {
    const l = document.createElement("link");
    l.id = "gz-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Crimson+Pro:wght@300;400;600&display=swap";
    document.head.appendChild(l);
  }
}
