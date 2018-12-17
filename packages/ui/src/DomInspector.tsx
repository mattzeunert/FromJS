import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import { selectInspectedDomCharIndex, selectAndTraverse } from "./actions";
import { TextEl } from "./TextEl";
import * as cx from "classnames";
import "./InspectedString.scss";

let DomInspector = class DomInspector extends React.Component<any, any> {
  render() {
    const { inspectedString } = this.props;
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
          </div>

          <div style={{ margin: -10, fontFamily: "monospace" }}>
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
    inspectedString: ["inspectedString"]
  },
  DomInspector
);

export default DomInspector;
