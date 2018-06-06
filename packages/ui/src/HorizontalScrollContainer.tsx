import * as React from "react";

export default class HorizontalScrollContainer extends React.Component<
  any,
  any
> {
  render() {
    return (
      <div className="fromjs-horizontal-scroll-container">
        <div>{this.props.children}</div>
      </div>
    );
  }
}
