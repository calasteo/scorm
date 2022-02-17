import "./App.css";
import "scorm-again/dist/scorm12.js";
import "scorm-again/dist/scorm2004.js";
import "scorm-again/dist/aicc.js";
import { useEffect, useState } from "react";
import axios from "axios";
// import axios from "axios";

let scormType,
  named = "";
let manifest = "";
// let url = "/scorm/seq/index_scorm.html"
// let manifest = "/scorm/seq/imsmanifest.xml"
//
// let url = "/scorm/quiz/res/index.html";
manifest = "/scorm/quiz/imsmanifest.xml";
//
// let url = "/scorm/360/index_lms.html"
//  manifest = "/scorm/360/imsmanifest.xml"

// let url = "/scorm/interactive/index.html"
//  manifest = "/scorm/360/imsmanifest.xml"

// let url = "/scorm/StopMoneyLaundering/index.html"
//  manifest = "/scorm/360/imsmanifest.xml"

// let url = "https://files.staging.pawonmburi.com/files/learning_staging_(updated)/html5/7f7ba44f59b52315e6f2123fdfae0728/quiz/res/index.html"
// manifest = "https://files.staging.pawonmburi.com/files/learning_staging_(updated)/html5/7f7ba44f59b52315e6f2123fdfae0728/quiz/imsmanifest.xml"

if (manifest.length > 0) {
  var request = new XMLHttpRequest();
  request.open("GET", manifest, false);
  request.send();
  var xml = request.responseXML;
  var users = xml.getElementsByTagName("metadata");
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var names = user.getElementsByTagName("schemaversion");
    for (var j = 0; j < names.length; j++) {
      named = names[j].childNodes[0].nodeValue;
    }
  }
}

// const lmsCommitUrl = "http://localhost:4000/api/scorm/data"
let settings = {
  logLevel: 4,
  // lmsCommitUrl: "http://localhost:4000/api/scorm/data",
  mastery_override: true,
  selfReportSessionTime: true,
  alwaysSendTotalTime: true,
  autocommit: false,
};
let x;
if (named === "1.2") {
  scormType = "API";
  // eslint-disable-next-line no-undef
  x = window.API = new Scorm12API(settings);
} else {
  scormType = "API_1484_11";
  // eslint-disable-next-line no-undef
  x = window.API_1484_11 = new Scorm2004API(settings);
}

const RenderIFrame = ({ lessonUrl }) => {
  useEffect(() => {
    const finishUrl = false;
    x.on("LMSInitialize", function () {
      // const customEvent = new CustomEvent("postToLMS", {
      //   detail: { name: "primary" },
      // });
      // document.dispatchEvent(customEvent);
      // alert("LMS INITIALIZE");
      x.LMSSetValue("cmi.core.lesson_status", "not attempted");
    });

    x.on("LMSSetValue.cmi.*", function (CMIElement, value) {
      if (CMIElement === "cmi.core.lesson_status") {
        let iframe = document.getElementById("scormPlayer");
        var elmnt = iframe.contentWindow.document.querySelector(
          ".component_container.exit div.tap_area"
        );
        if (elmnt) {
          elmnt.addEventListener("touchend", function () {
            x.LMSFinish();
            // let data = x.LMSGetValue("cmi").toJSON();
            // const string_data = JSON.stringify(data);
            // const customEvent = new CustomEvent("postToLMS", string_data);
            // document.dispatchEvent(customEvent);
            iframe.setAttribute(
              "src",
              finishUrl ? finishUrl : "https://google.com"
            );
          });
        }
      }
    });

    x.on("LMSFinish", function () {
      let data = x.LMSGetValue("cmi").toJSON();
      axios.post(
        "https://f848-2001-448a-4009-6c01-e87e-9315-1318-9581.ngrok.io",
        { cmi: data }
      );

      const status = x.LMSGetValue("cmi.core.lesson_status");
      if (status === "incomplete") {
        // x.LMSSetValue("cmi.core.lesson_status", "completed")
      }

      // let data = x.LMSGetValue("cmi").toJSON();
      const string_data = JSON.stringify(data);
      const customEvent = new CustomEvent("postToLMS", {
        detail: { name: string_data },
      });
      document.dispatchEvent(customEvent);

      // let data = x.LMSGetValue('cmi')
      // axios.post(lmsCommitUrl, {cmi: data}).then(res => {
      //     console.log(res.data)
      // });
    });
  }, [lessonUrl]);

  return (
    <iframe
      id="scormPlayer"
      name={scormType}
      style={{ height: "100%", width: "100%" }}
      src={lessonUrl}
      frameBorder="0"
      title="scorm"
    />
  );
};

function App() {
  const [userCourseData, setUserCourseData] = useState();
  useEffect(() => {
    document.addEventListener("postToLMS", (data) => {
      window.ReactNativeWebView?.postMessage(data.detail.name);
    });
    return () => {
      document.removeEventListener("postToLMS");
    };
  }, []);

  useEffect(() => {
    function handleEvent(message) {
      const user_json = JSON.parse(message.data);

      setUserCourseData(user_json);

      user_json.id = "121221";
      user_json.name = "budi p";

      if (scormType === "API") {
        x.cmi.core.student_id = user_json.id;
        x.cmi.core.student_name = user_json.name;
      } else {
        x.cmi.learner_id = user_json.id;
        x.cmi.student_name = user_json.name;
      }
    }
    document.addEventListener("message", handleEvent); // android
    return () => document.removeEventListener("message", handleEvent);
  }, []);

  return (
    <div className="App">
      {userCourseData?.token && userCourseData?.url ? (
        <RenderIFrame lessonUrl={userCourseData?.url} />
      ) : (
        <p>Loading</p>
      )}
    </div>
  );
}

export default App;
