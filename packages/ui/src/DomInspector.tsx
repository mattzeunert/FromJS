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
    return (
      <div className="inspected-string">
        <div>
          <div className="title">
            Inspected DOM HTML (click a character to view its origin)
          </div>

          <div style={{ border: "1px solid #ddd", borderTop: "none" }}>
            <TextEl
              highlightedCharacterIndex={this.props.inspectedString.charIndex}
              onCharacterClick={charIndex => {
                if (this.props.inspectedString.type === "dom") {
                  selectInspectedDomCharIndex(charIndex);
                } else {
                  selectAndTraverse(
                    this.props.inspectedString.logIndex,
                    charIndex,
                    "traversalStep"
                  );
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
