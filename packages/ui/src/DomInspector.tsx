import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import {
  selectInspectedDomCharIndex,
  selectAndTraverse,
  undoSelection
} from "./actions";
import { TextEl } from "./TextEl";
import * as cx from "classnames";
import "./InspectedString.scss";

let DomInspector = class DomInspector extends React.Component<any, any> {
  render() {
    const { inspectedString, canUndoSelection } = this.props;
    if (!inspectedString) {
      return null;
    }
    const { type, logIndex, charIndex } = inspectedString;
    return (
      <div className="inspected-string">
        <div>
          <div className="title">
            {type === "dom" ? "Inspected DOM HTML" : "Inspected value"} (click a
            character to view its origin)
            {canUndoSelection && (
              <button
                style={{
                  height: 15,
                  width: 15,
                  marginLeft: 10,
                  border: "none",
                  backgroundSize: "100%",
                  backgroundImage:
                    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAACWUlEQVR4Ae3YA7AdQRCF4Ylt2+acjgqxU4gKsW3bNgqxbdtOSrFt257Yu/ddTEevvy5ju/6LlVJKCCGEEEIIIYQQQgghBLqrfxsZ6vCvB/AnsAfwJ7AHGLRQfsoaF8WpIQZhAXbhKF3Dc3qGy3QQGzBGt8peKltaFYo1wN8EnYw60BJcJhPkvKLjNJXKUETWAO8TMsXUTbGLjM/zDHN1YZYA7xMoPY2mp2T8H5yk1qmjsgR8nIbKFTJgORkr84TGZ03HEOCekDkJJuMNGYvzUvdLHp4hwCEhFLXGczIMczF7UY6AHxKQgfaR4RtMpmj2A4yupT5CObwgwzzXkMd6AN5+SKA2ZH7LvKJmFgO+JNA6L5cfpplop0tmS6S+CaUzogqGYxseexeBSSqE1QCvZg/qpYuiPAul82EYnfHiaPNU6N8XcAcjfDuT62zoS7fJeJwVXxJ4A26jXeIIyg+pw6E+bng89mIVijUAbzE4U2QVgKyRMJBeedgwhzEAp3QOZQGILnrY0pYpABvt3YRlj45V7ue1bJoj4LAKqayirnjrsuts1kgc38BwZZmu5paAaQwBLAkVXe9xK/GcRvsry1DD7UpD0TgCGBKoq/Mm9GEJYEgIQZucn6Ezx+MIYEjIFBM3nfZgME8AQwKKO255mC4KUwBDwnTHLR14AhgSsiamlw4/oisqBE8AQwKNdNqhi3AGGPRQ1mRL5HSXitlsAfbfbGPSD0d+TZt0U52QK4AhIXvOr29Rl6JGlhjcz8QMCdiCGbr8t/fYQgghhBBCCCGEEEIIIYQQ7wC30XOuMHjaSwAAAABJRU5ErkJggg==)",
                  cursor: "pointer"
                }}
                onClick={() => undoSelection()}
                title="Undo"
              />
            )}
            {window.parent !== window && (
              <button
                style={{
                  height: 15,
                  width: 15,
                  marginLeft: 10,
                  border: "none",
                  backgroundSize: "100%",
                  backgroundImage:
                    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABqElEQVR4Ae3bAWYDARCF4QFNVa7QtAiwxXZGICCHSs9QOUJzhkov0GjJBZqbREIaSFIBKGF3f7xd5g0A6/+wAlnLXV8ul8vlcrnc072/+Hds4tzs7N/Ac+qv6MeHn+IMTgkY9nzN4sUAn/N8IcCHfuw0IF55vBTgPx0HxG/HAQ0eAFeOfKcH8Hw9gOfrATxfD+D5QgDP94MUwPPLiRTA882kAJ4vBvB8MYDniwE8XwTg+R0AlOMK+QJA5fzYV8nXA0i+HgDy9QCQrweAfD0A5OsBIB+MA0B+7Hk+B5D8sZkAIMhXAlC+HoDy9QCUrwegfD0A5et/yMoJyNcDyokfQL4KAPL1AJCvB4B8PQDk6wEgXw8A+XpA9XzfVcgXAKrnj8w6AfB3lK8HFDe+RPn6d+Dx1pcgXw+4EGIF8vUAs7iLFcjXAy4E/wT5MsCVJSABCUhAAhKQgARs49yi2/K/HkvP1/UBs1YBZlZ3zw9+bE3+MQZWf/7WGsDcmmzYa8d74Othz5qt6PvCT9L4ky+KvpHFIKYNPsPit4mvmMbAcrlcLpfL5XJX9wer5f8CHBdblgAAAABJRU5ErkJggg==)",
                  cursor: "pointer"
                }}
                onClick={() => {
                  // Noopener hopefully means the window will open in a new process
                  // so even if the inspected page is busy the inspector will still be interactive
                  window.open("/", "_blank", "noopener");
                  window.parent.postMessage({ type: "openInNewTab" }, "*");
                }}
                title="Open in new tab"
              />
            )}
          </div>

          <div
            style={{
              margin: -10,
              marginTop: 0,
              fontFamily: "monospace",
              fontSize: 16
            }}
          >
            <TextEl
              highlightedCharacterIndex={charIndex}
              onCharacterClick={charIndex => {
                if (type === "dom") {
                  selectInspectedDomCharIndex(charIndex);
                } else {
                  selectAndTraverse(logIndex, charIndex, "traversalStep");
                }
              }}
              text={this.props.inspectedString.text}
            />
          </div>
        </div>
      </div>
    );
  }
};
DomInspector = branch(
  {
    inspectedString: ["inspectedString"],
    canUndoSelection: ["canUndoSelection"]
  },
  DomInspector
);

export default DomInspector;
