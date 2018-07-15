import * as React from "react";

export default function({ children }) {
  return (
    <div className="named-step-container">
      <div>
        <div className="title">
          {children[0]}
          <div className="named-step-container__title-border-cover">
            <div />
          </div>
        </div>
        <div className="named-step-container__title-corner">
          <svg>
            <line x1="0" y1="0" x2="200" y2="200" />
          </svg>
          <div />
        </div>
      </div>

      {children[1]}
    </div>
  );
}
