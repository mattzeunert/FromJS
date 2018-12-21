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
