import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import { selectInspectedDomCharIndex, expandDomInspector } from "./actions";
import { TextEl } from "./TextEl";
import * as cx from "classnames";
import "./InspectedString.scss";

let DomInspector = class DomInspector extends React.Component<any, any> {
  render() {
    if (!this.props.domToInspect) {
      return null;
    }
    //this.props.collapseDomInspector
    return (
      <div className="inspected-string">
        <div>
          <div className="title">
            Inspected DOM HTML{this.props.collapseDomInspector ? (
              <button onClick={() => expandDomInspector()}>
                Show inspected Element
              </button>
            ) : (
              " (click a character to view its origin)"
            )}
          </div>
          {!this.props.collapseDomInspector && (
            <div style={{ border: "1px solid #ddd", borderTop: "none" }}>
              <TextEl
                highlightedCharacterIndex={this.props.domToInspect.charIndex}
                onCharacterClick={charIndex => {
                  selectInspectedDomCharIndex(charIndex);
                }}
                text={this.props.domToInspect.outerHTML}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
};
DomInspector = branch(
  {
    domToInspect: ["domToInspect"],
    collapseDomInspector: ["collapseDomInspector"]
  },
  DomInspector
);

export default DomInspector;
