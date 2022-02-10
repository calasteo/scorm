import "./App.css";
import "scorm-again/dist/scorm12.js";
import "scorm-again/dist/scorm2004.js";
import "scorm-again/dist/aicc.js";
import { useEffect, useState } from "react";
import axios from "axios";

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

const lmsCommitUrl = "https://3b10-2001-448a-4002-4f12-e4e4-5bd4-350e-e810.ngrok.io/api/scorm/data"

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

const RenderIFrame = ({ userCourseData }) => {

    useEffect(() => {
        axios.defaults.headers.common["token"] = userCourseData.token
    }, userCourseData)

  x.on("LMSInitialize", function () {
    const customEvent = new CustomEvent("postToLMS", {
      detail: { name: "primary" },
    });
    document.dispatchEvent(customEvent);

    x.LMSSetValue("cmi.core.lesson_status", "not attempted");
  });

  x.on("LMSSetValue.cmi.*", function (CMIElement, value) {
    // window.ReactNativeWebView.postMessage("LMS set value for ",CMIElement)
    // window.ReactNativeWebView.postMessage("value : ",value)
  });

  x.on("LMSFinish", function () {
    const status = x.LMSGetValue("cmi.core.lesson_status");
    if (status === "incomplete") {
      // x.LMSSetValue("cmi.core.lesson_status", "completed")
    }
    let data = x.LMSGetValue('cmi')
    axios.post(lmsCommitUrl, {cmi: data}).then(res => {
        console.log(res.data)
    });
  });

  return (
    <>
      <h1>{user}</h1>
      <iframe
        name={scormType}
        style={{ height: "100%", width: "100%" }}
        src={userCourseData.url}
        frameBorder="0"
        title="scorm"
      />
    </>
  );
};

// const RenderUser = ({ user, setUser }) => {
//   const [name, setName] = useState("AdminPru");
//   const [id, setId] = useState("Xasdfd2sagfF");

//   function submitForm(e) {
//     let errors = [];
//     if (id === "") {
//       errors.push("ID wajib diisi");
//     }
//     if (name === "") {
//       errors.push("Name wajib diisi");
//     }
//     if (errors.length > 0) {
//       alert(errors.join(" | "));
//       return;
//     }
//     setUser({ id, name });
//     if (scormType === "API") {
//       x.cmi.core.student_id = id;
//       x.cmi.core.student_name = name;
//     } else {
//       x.cmi.learner_id = id;
//       x.cmi.student_name = name;
//     }
//   }

//   return (
//     <div className="form-user-karis">
//       <div className="form-group">
//         <label htmlFor="id">ID</label>
//         <input
//           type="text"
//           name={"id"}
//           id={"id"}
//           value={id}
//           onChange={(e) => setId(e.value)}
//         />
//       </div>
//       <div className="form-group">
//         <label htmlFor="name">Name</label>
//         <input
//           type="text"
//           name={"name"}
//           id={"name"}
//           value={name}
//           onChange={(e) => setName(e.value)}
//         />
//       </div>
//       <div className="form-group end">
//         <button onClick={() => submitForm()}>Submit</button>
//       </div>
//     </div>
//   );
// };

// const scormHandler = (data) => {
//   window.ReactNativeWebView?.postMessage("LMS INITIALIZE JANCOOOK");
//   window.ReactNativeWebView?.postMessage(data.detail);
// };

function App() {
  const [userCourseData, setUserCourseData] = useState(null);
  // useEffect(() => {
  //     // const event = new Event('build')
  //     document.addEventListener("postToLMS", scormHandler)
  //     return () => {
  //         document.removeEventListener("postToLMS", scormHandler)
  //     }
  // }, [])
  // listen events from react-native and trigger app status refetch
  useEffect(() => {
    function handleEvent(message) {
      setUserCourseData(message.data);
    }
    
    document.addEventListener("message", handleEvent); // android
    // window.addEventListener("message", handleEvent); // ios

    return () => document.removeEventListener("message", handleEvent);
  }, []);
  return (
    <div className="App">
      {userCourseData == null ? (
        <p>Loading...</p>
      ) : (
        <RenderIFrame userCourseData={userCourseData} />
      )}
    </div>
  );
}

export default App;
