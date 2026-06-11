import { useState } from "react";
import { C } from "../lib/theme";
import { timeAgo } from "../lib/articles";

export function ArticleCard({ article, highlighted }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasImg = article.image && !imgFailed;
  const domain = (() => { try { return new URL(article.url).hostname.replace("www.", ""); } catch { return ""; } })();

  return (
    <div
      className={`gz-card${expanded ? " gz-card--expanded" : ""}${!hasImg ? " gz-card--no-image" : ""}`}
      style={{ border: `1px solid ${highlighted ? C.green + "88" : C.border}`, cursor: "pointer" }}
      onClick={() => setExpanded(e => !e)}>

      {hasImg
        ? <div className="gz-card-imgwrap">
            <img src={article.image} alt="" className="gz-card-img" onError={() => setImgFailed(true)} />
            <div className="gz-card-imggrad" />
          </div>
        : <div className="gz-card-stripe" style={{ background: highlighted ? C.green : "#2a2a2a" }} />
      }

      <div className="gz-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.green, fontFamily: "Crimson Pro, serif", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, lineHeight: 1.3 }}>
            {highlighted && "★ "}{article.source?.name || domain || "Fonte"}
          </span>
          <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{timeAgo(article.publishedAt)}</span>
        </div>

        <h3 className="gz-card-title">{article.title}</h3>

        {article.description && <p className="gz-card-desc">{article.description}</p>}

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
          <span style={{ fontSize: 12, color: C.muted }}>{domain}</span>
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            className="gz-card-read-link"
            onClick={e => e.stopPropagation()}>
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}
