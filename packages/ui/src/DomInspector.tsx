import * as React from "react";
import { branch, root } from "baobab-react/higher-order";
import appState from "./appState";
import { callApi } from "./api";
import { TextEl } from "./TextEl";

let inspectDom;
let DomInspector = class DomInspector extends React.Component<any, any> {
  render() {
    // if (Math.random() > 0.0000000001) {
    //   return null;
    // }

    if (!this.props.domToInspect) {
      return null;
    }
    return (
      <div>
        inspect dom
        <TextEl
          onCharacterClick={charIndex => {
            callApi("inspectDomChar", {
              charIndex
            }).then(({ logId, charIndex }) => {
              appState.set("inspectionTarget", { logId, charIndex });
            });
          }}
          text={this.props.domToInspect.outerHTML}
        />
        {/* <pre>
          {JSON.stringify(this.state.domInfo, null, 4)}
          {this.state.domInfo.outerHTML}
          <button onClick={() => this.inspect(5)}>inspect char 5</button>
        </pre> */}
      </div>
    );
  }
};
DomInspector = branch(
  {
    domToInspect: ["domToInspect"]
  },
  DomInspector
);

export default DomInspector;
