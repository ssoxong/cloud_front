import React, { useCallback, useState, useEffect } from "react";

import * as go from "gojs";
import "../styles/Button.css"; // contains .diagram-component CSS
import { json, useNavigate } from "react-router-dom";

import { rehostRequest,requirementRequest} from "../apis/fileAPI";
import {BsUpload,BsDownload,  BsEraser, BsSave, } from "react-icons/bs"
import {BiSave} from "react-icons/bi"
import { sidebarResource } from "../apis/sidebar"
import { useData } from '../components/DataContext';



const Button = ({
  diagram,
  setShowToggle,
  finalToggleValue,
  setFinalToggleValue,
}) => {
  const hiddenFileInput = React.useRef(null);
  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  const [finalToggleVal, setFinalToggleVal] = useState({});
  const [clickedLoaded, setClickedLoaded] = useState(false);
  const { setData } = useData();
  const [isRehost, setIsRehost] = useState(false);

  

  
  useEffect(() => {
    setFinalToggleValue(finalToggleVal);
  }, [finalToggleVal]);

  const handleSave = () => {
    if (diagram) {
      let jsonCombinedArray = diagram.model.toJson();
      jsonCombinedArray = JSON.parse(jsonCombinedArray);
      jsonCombinedArray["cost"] = finalToggleValue; //ec2도 해야할 듯
      jsonCombinedArray = JSON.stringify(jsonCombinedArray);

      //setSavedDiagramJSON(jsonCombinedArray,finalToggleValue);
      //console.log("저는 json이에요", jsonCombinedArray, finalToggleValue);
      localSaveJSON(jsonCombinedArray);
    }
  };

  const localSaveJSON = (target) => {
    const blob = new Blob([target], { type: "text/json" });
    // make download link
    let fileName = prompt("명을 입력해주세요:", "diagram.json");
    // 사용자가 프롬프트를 취소하거나 이름을 제공하지 않으면 함수 종료
    if (!fileName) {
      return;
    } else if (!fileName.endsWith(".json")) {
      fileName += ".json";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  };

  const localSaveImage = () => {
    if (diagram) {
      const imgData = diagram.makeImageData({
        scale: 1,
        background: "white",
      });
      let fileName = prompt("파일명을 입력해주세요:", "diagram.png");
      // 사용자가 프롬프트를 취소하거나 이름을 제공하지 않으면 함수 종료
      if (!fileName) {
        return;
      } else if (!fileName.endsWith(".png")) {
        fileName += ".png";
      }
      const a = document.createElement("a");
      a.href = imgData;
      a.download = fileName;
      a.click(); // 다운로드 링크 클릭
    }
  };



  const handleLoad = async () => {
    try {
      const jsonString = diagram.model.toJson();
      const diagramObject = JSON.parse(jsonString);
      const types = diagramObject.nodeDataArray.map(node => node.type);
      const otherTypes = types.filter(type => type !== "Network_icon" && type !== "group" && type !== undefined );
      const containsOtherTypes = otherTypes.length > 0;
      
      if(containsOtherTypes){
        alert("클라우드 아키텍처가 포함되어있으면 Rehost 하지 못합니다.")
        return;
      }
      if (clickedLoaded) {
        alert("클라우드 아키텍처는 Rehost 하지 못합니다.")
        return;
      }
      
      const response = await rehostRequest(jsonString);
      //console.log("response", response.data.result);
      const Jdata = response.data.result;
      diagram.model = go.Model.fromJson(Jdata);
      const response1 = await sidebarResource(diagram.model.nodeDataArray);
      setData(response1.data); // set the data in context
      setClickedLoaded(true);
      setIsRehost(true);

    } catch (error) {
      console.error("rehost error: ", error);
    }
  };

  const ToOptimize = () => {
    <div className="home-content">
      <div className="img-container">
        hello
      </div>
    </div>
  }

  const onFileChange = (e) => {
    if (e.target.files[0] && e.target.files[0].name.includes("json")) {
      let file = e.target.files[0];
      let fileReader = new FileReader();
      fileReader.readAsText(file);
      fileReader.onload = async() => {
        //console.log("json", fileReader.result);

      let filejson = JSON.parse(fileReader.result);
      if (filejson.hasOwnProperty("cost")) {
        setFinalToggleVal(filejson["cost"]);
      }
      if (fileReader.result && diagram) {
        diagram.model = go.Model.fromJson(fileReader.result);
        //console.log(JSON.stringify(diagram.model));
        const response1 = await sidebarResource(diagram.model.nodeDataArray);
        setData(response1.data); // set the data in context
        setShowToggle(true);
        setClickedLoaded(false);
      }
      };
    } else if (e.target.files[0] && !e.target.files[0].name.includes("json")) {
      alert("Json형식의 파일을 넣어주세요.");
    }
    e.target.value = null;
  };

  const handleReset = async() => {
    if (diagram) {
      diagram.startTransaction("Cleared diagram");
      setFinalToggleValue({});
      //diagram.model.groupDataArray = [];
      //diagram.model.nodeDataArray = [];
      //diagram.model.linkDataArray = [];
      diagram.clear();
      diagram.commitTransaction("Cleared diagram");
    }
    const response1 = await sidebarResource(diagram.model.nodeDataArray);
    setData(response1.data); // set the data in context
    setClickedLoaded(false);
    setShowToggle(false); // toggle 숨김
  };


  const requirement = async() => {
    try{
      const jsonString1 = diagram.model.toJson();
      let jsonString2 = JSON.parse(jsonString1); // 'let'으로 변경

      // 여기서 jsonString2를 result 키로 갖는 새 객체로 변환
      jsonString2 = { result: jsonString2 };
      const response1 = await requirementRequest(jsonString2);
      console.log("requirement:",response1);
      const Jdata1 = response1.data.result;
      console.log("Jdata1", Jdata1);
      diagram.model = go.Model.fromJson(Jdata1);
      

     
      //console.log("response", response.data.result);
      
    }
    catch (error) {
      console.error("requirement error: ", error);
    }
  }

 

  return (
    <div>
      <div className="button-container">
        <div className="button-row">
          <button onClick={handleClick}><BsUpload/></button>
          <input
            type="file"
            ref={hiddenFileInput}
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="button-row">
          <button onClick={handleReset}><BsEraser/></button>
        </div>
        <div className="button-row">
          <button onClick={handleSave}><BsDownload/></button>
        </div>
        <div className="button-row">
          <button onClick={localSaveImage}><BiSave/></button>
        </div>
        <div className="button-row">
            {
              !isRehost && (
                <button onClick={handleLoad}>Rehost</button>
              )
            }
            {
              isRehost && (
                <button onClick={ToOptimize}>Optimize</button>
              )
            }
            
        </div>
        <div className="button-row">
          <button onClick={requirement}>require</button>
        </div>
      </div>
    </div>
  );
};

export default Button;