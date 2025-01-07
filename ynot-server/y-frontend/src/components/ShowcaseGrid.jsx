import React from "react";

function ShowcaseGrid({ sites }) {
  return (
    <div className="showcaseGrid">
      {sites.map((site, index) => (
        <div
          key={index}
          className="showcaseRow"
          onClick={() => window.open(site.url)}
        >
          <div className="iframeWrapper">
            <iframe
              src={site.url}
              title={site.name}
              className="showcaseItem"
            ></iframe>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShowcaseGrid;
