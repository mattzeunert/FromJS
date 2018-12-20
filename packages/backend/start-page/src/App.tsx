import * as React from "react";
import { Fun } from "./Fun";

export class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Get started with FromJS</h1>
        <ol
          style={{
            paddingTop: 40,
            paddingBottom: 10
          }}
        >
          <li>Click "Enable DOM inspector" in the bottom right corner</li>
          <li>Click on an element somewhere on this page</li>
          <li>A sidebar will pop up with analysis information</li>
        </ol>
        <h2>Inspecting other sites</h2>
        <p>
          Just naviate to another page in this Chrome window. The page will
          automatically analyzed and the "Enable DOM inspector" button
          displayed.
        </p>

        <h2>Tips</h2>
        <p>
          Instead of using the DOM inspector you can also use the{" "}
          <code>fromJSInspect</code> function. For example, you can run{" "}
          <code>fromJSInspect(document.querySelector("#app"))</code> in the
          console.
        </p>
        <p>
          If you control the code of the site your're inspecting you can also
          just pass a value into `fromJSInspect`. Or use it when eval'ing code:
        </p>
        <pre>{`fromJSEval(\`
      var href = location.href;
      var str = "Current URL: " + href;
      fromJSInspect(str);
  \`)`}</pre>
        <h2>Caveats</h2>
        <p>
          Expect lots of slowness and breaking behavior. Delete the
          `fromjs-session` directory after using FromJS to save disk space.
        </p>
        <h2>Some fun things to inspect</h2>
        <Fun />
        <h2>Issue Tracker</h2>
        <p>
          You can ask questions and report bugs{" "}
          <a href="https://github.com/mattzeunert/FromJS/issues">on Github</a>
          .
        </p>
      </div>
    );
  }
}
