/* Palette: nero + verde, max 6 valori
   Contrasti su #000:  text 15.4:1 · muted 5.9:1 · green 9.2:1 · danger 5.6:1 */
export const C = {
  bg:       "#000000",
  card:     "#333333",
  hover:    "#161616",
  green:    "#22c55e",
  greenDim: "#071a0e",
  label:    "#A0A0A0",
  text:     "#ebebeb",
  muted:    "#888888",
  border:   "#666666",
  danger:   "#ef4444",
  orange:   "#f97316",
};

const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#000;overflow-x:hidden;overscroll-behavior-y:none}

.gz-grid{display:grid;gap:10px;grid-template-columns:1fr}
@media(min-width:480px){.gz-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.gz-grid{grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}}

.gz-card{display:flex;flex-direction:column;background:#0d0d0d;border-radius:8px;overflow:hidden;text-decoration:none;transition:border-color .15s,transform .15s}
@media(hover:hover){.gz-card:hover{border-color:#22c55e!important;transform:translateY(-2px)}}

.gz-card-img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;object-position:center}
.gz-card-imgwrap{position:relative;flex-shrink:0}
.gz-card-imggrad{position:absolute;inset:auto 0 0 0;height:100%;background:linear-gradient(to bottom,transparent,#0d0d0d);pointer-events:none;transition:opacity .35s ease}
@media(min-width:900px){.gz-card-imggrad{display:none}}

.gz-card-stripe{width:100%;height:2px}

.gz-card-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:9px;flex:1;min-width:0;position:relative;z-index:1;margin-top:-6rem;transition:margin-top .35s ease}
@media(min-width:900px){.gz-card-body{margin-top:0;transition:none}}

.gz-card-title{margin:0;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#ebebeb;line-height:1.3;display:block;overflow:visible}
@media(min-width:900px){.gz-card-title{font-size:18px}}

.gz-card-desc{margin:0;font-family:'Crimson Pro',serif;font-size:14px;color:#aaaaaa;line-height:1.6;max-height:0;overflow:hidden;opacity:0;transform:translateY(-8px);transition:opacity .3s ease .12s,max-height .35s ease,transform .3s ease .12s}
@media(min-width:900px){.gz-card-desc{font-size:16px;line-height:1.5;max-height:300px;opacity:1;transform:none;transition:none}}

.gz-aside{position:fixed;inset:0;z-index:200;overflow-y:auto;background:#000;border-right:none}
@media(min-width:640px){.gz-aside{position:sticky;inset:auto;top:0;width:310px;flex-shrink:0;max-height:100vh;z-index:10;background:#0d0d0d;border-right:1px solid #1e1e1e}}

.gz-date{display:none}
@media(min-width:480px){.gz-date{display:inline}}

.gz-card--expanded .gz-card-imggrad{opacity:0}
.gz-card--expanded .gz-card-body{margin-top:0}
.gz-card--expanded .gz-card-img{aspect-ratio:auto}
.gz-card--no-image .gz-card-body{margin-top:0}
.gz-card--expanded .gz-card-desc{max-height:300px;opacity:1;transform:translateY(0);line-height:1.4}
.gz-card-read-link{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:#22c55e;text-decoration:none;font-family:'Crimson Pro',serif;font-weight:600}
.gz-card-read-link:hover{text-decoration:underline}

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
