import React, { useState, useCallback, useEffect } from "react";
import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import styled from "styled-components";
import useGoJS from "../hooks/useGoJS.js";
import SelectEc2Toggle from "../components/cost/SelectEc22Toggle";
import SelectRdsToggle from "../components/cost/SelectRdsToggle";
import SelectS3Toggle from "../components/cost/SelectS3Toggle";
import SelectWafToggle from "../components/cost/SelectWafToggle";
import { useMediaQuery } from "react-responsive";
import { nodeDataArrayPalette } from "../db/Node";
import { Badge, Avatar } from 'antd';
import { BellOutlined } from '@ant-design/icons';

import { useLocation } from "react-router-dom";
import { message } from "antd";
import { Button, notification } from "antd";
import { Alert, Space, Modal, Input } from "antd";
import { saveDiagram, updateDiagram } from "../apis/fileAPI";
import "../styles/App.css";

// 페이지
// import useReadJSON from "./useReadJSON";
import ModalButton from "./Button.js";
import Palette from "../components/Palette";
import "../styles/Draw.css";
import { useFileUpload } from "../components/useFileInput";
import RequirementPopup from "../components/RequirementPopup";
import { useData } from "../components/DataContext.js"; // DataContext의 경로를 수정하세요

import { InfoCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';

const close = () => {
  console.log("Notification was closed.");
};

message.config({
  top: 50,
  duration: 1,
});


function Draw() {
  const { data } = useFileUpload();
  //console.log("draw data ", data);
  const isDesktopOrLaptop = useMediaQuery({ query: "(min-width: 700px)" });
  const paletteClassName = isDesktopOrLaptop
    ? "palette-component"
    : "palette-component-small";
  const diagramClassName = "diagram-component";

  const [finalToggleValue, setFinalToggleValue] = useState({});
  const [selectedNodeData, setSelectedNodeData] = useState(null); // <- 상태 변수를 추가합니다.
  const [showToggle, setShowToggle] = useState(true);
  const { setData } = useData();
  const [mydiagram, setmyDiagram] = useState(null);
  const [NodeGuide, setNodeGuide] = useState(null);
  const [isSave, setIsSave] = useState(false); // 저장 여부 판단
  const [alertMessage, setAlertMessage] = useState({
    key: null,
    message: null,
    tag: null,
  });

  const [handleMessageQueue, setHandleMessageQueue] = useState([]);

  const [fileName, setFileName] = useState("제목 없는 다이어그램");

  const [diagramVersion, setDiagramVersion] = useState(0);
  const [isPopup, setIsPopup] = useState(false);
  const [countAlert, setCountAlert] = useState(0);

  const { isSidebarOpen, setIsSidebarOpen } = useData();

  const location = useLocation();
  const info = location.state ? location.state.info : null;
  const save = location.state ? location.state.save : false;
  const onpremise = location.state ? location.state.file : null;
  useEffect(() => { }, [diagramVersion]); // Dependency on diagramVersion


  // const [nodeRole, setNodeRole] = useState({});

  // useEffect(() => {
  //   setNodeRole(jsonData); // JSON 파일에서 데이터 가져오기
  // }, []);

  const handleDiagramChange = useCallback((changedDiagram) => {
    setmyDiagram(changedDiagram);
    setDiagramVersion((prevVersion) => prevVersion + 1);
  });

  // const handleguide = useCallback((guide) => {
  //   setNodeGuide(guide);
  // });
  const { initDiagram, diagram, showSelectToggle, clickedNodeKey } = useGoJS(
    setShowToggle,
    handleDiagramChange,
    // handleguide,
    setAlertMessage,
  );

  useEffect(() => {
    setIsSave(save);
    if (info && diagram) {
      setFileName(info.filename);
      if (info.file.result.hasOwnProperty("cost")) {
        setFinalToggleValue(info.file.result["cost"]);
      }
      const diagramModel = go.Model.fromJson(info.file.result);
      diagram.model = diagramModel;
    }

    if (onpremise && diagram) {
      const diagramModel = go.Model.fromJson(onpremise);
      diagram.model = diagramModel;
    }
  }, [info, diagram]);

  useEffect(() => {
    if (diagram) {
      diagram.clear(); //다른 로케이션으로 가면 다이어그램을 없앤다
    }
    setData(null);
  }, [location]);

  const handleNodeSelect = useCallback(
    (label) => {
      if (diagram) {
        const selectedNode = diagram.selection.first();
        if (selectedNode instanceof go.Node) {
          //const updsPopupatedData = { ...selectedNode.data, text: label };
          diagram.model.commit((model) => {
            model.set(selectedNode.data, "text", label);
          }, "updated text");
        }
      }
      setSelectedNodeData(label);
    },
    [diagram]
  );
  // useReadJSON(file,diagram);

  //popup
  const handlePopup = () => {
    setIsSidebarOpen(!isSidebarOpen);
    return setIsPopup(!isPopup);
  };

  const handlePopupChange = (newPopupState) => {
    setIsPopup(newPopupState);
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    console.log("isSave", isSave);
    setIsModalVisible(false);
    const hideLoading = message.loading("저장 중...", 0);

    try {
      let diagramData = diagram.model.toJson();
      diagramData = JSON.parse(diagramData);
      diagramData["cost"] = finalToggleValue;
      diagramData = JSON.stringify(diagramData);

      // 이미지 데이터 생성
      const img = diagram.makeImageData({
        scale: 0.6,
        background: "white",
        type: "image/png",
      });

      const base64ImageContent = img.split(",")[1];

      var response;
      if (!isSave) {
        console.log("save");
        response = await saveDiagram(diagramData, fileName, base64ImageContent);
      }
      else {
        console.log("update");
        console.log("diagramData", diagramData);
        console.log("fileName", fileName);
        console.log("base64ImageContent", base64ImageContent);
        response = await updateDiagram(diagramData, fileName, base64ImageContent);
      }

      hideLoading();


      console.log(response.data);
      if (response.data === true) {
        message.success("저장되었습니다.");
        if (!isSave) {
          setIsSave(true);
        }

      }
      else {
        message.warning("중복된 이름이 존재합니다. 다시 시도해주세요.");
      }
    } catch (error) {
      hideLoading();
      message.error("저장 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    message.info("파일 저장이 취소되었습니다.");
  };

  const handleChange = (e) => {
    setFileName(e.target.value);
  };

  const handleSaveDiagram = () => {
    if (!isSave) {
      showModal();
    }
    else {
      handleOk();
    }
  };

  const [messageQueue, setMessageQueue] = useState([]);

  useEffect(() => {
    console.log("Updated messageQueue: ", messageQueue);
  }, [messageQueue]);

  useEffect(() => {
    if (alertMessage.message !== null) {
      const isMessageInQueue = messageQueue.some(queueMessage =>
        queueMessage.message === alertMessage.message
      );
      if (!isMessageInQueue) {
        queueMessage(alertMessage);
      }
    }
  }, [alertMessage, setMessageQueue]);

  const [api, contextHolder] = notification.useNotification();
  const [areNotificationsShown, setAreNotificationsShown] = useState(false);

  const queueMessage = (message) => {
    setMessageQueue(prevQueue => [...prevQueue, message]);
  };
  

  const showAlertMessages = () => {
    if (areNotificationsShown) {
      // Hide notifications
      api.destroy();
      setAreNotificationsShown(false);
    } else {
    messageQueue.forEach((alertMessage, index) => {
      setTimeout(() => {
        const key = `open${Date.now()}`;

        const removeMessageFromQueue = (keyToRemove) => {
          console.log(keyToRemove)
          if (keyToRemove === -1) {
            setMessageQueue([]);
          } else {
            setMessageQueue(currentQueue => 
              currentQueue.filter(message => message.key !== keyToRemove)
            );
          }
        };
        

        const btn = (
          <Space>
            <Button type="link" size="small" onClick={() => { api.destroy(); setAreNotificationsShown(false) }}>
              모두 숨기기
            </Button>
            <Button type="link" size="small" onClick={() => { api.destroy(key); removeMessageFromQueue(alertMessage.key); }}>
              지우기
            </Button>
            <Button type="link" size="small" onClick={() => { api.destroy(key);}}>
              숨기기
            </Button>
          </Space>
        );

        let backgroundColor;
        switch (alertMessage.tag) {
          case "Error":
            backgroundColor = "#FFF0F0"; // 에러 배경색
            break;
          case "Warn":
            backgroundColor = "#FFF8E0"; // 경고 배경색
            break;
          case "Info":
            backgroundColor = "#DFE8FF"; // 정보 배경색
            break;
          default:
            backgroundColor = "#FFFFFF"; // 기본 배경색
            break;
        }

        let backgroundTitle;
        switch (alertMessage.tag) {
          case "Error":
            backgroundTitle = <><CloseCircleOutlined style={{ color: 'red' }} />  Error!</>; // 에러 배경색
            break;
          case "Warn":
            backgroundTitle = <><WarningOutlined style={{ color: 'orange' }} />  Warning</>; // 경고 배경색
            break;
          case "Info":
            backgroundTitle = <><InfoCircleOutlined style={{ color: 'blue' }} />  Info</>; // 정보 배경색
            break;
          default:
            backgroundTitle = "Nothing"; // 기본 배경색
            break;
        }

        api.open({
          message: backgroundTitle,
          description: alertMessage.message,
          btn,
          key,
          onClose: close,
          style: { backgroundColor, borderRadius: "8px", fontFamily: "Noto Sans KR" },
          duration: 0
        });
      }, index * 200); // Delay each message to stagger their appearance
    });
    setAreNotificationsShown(true);
  }
    // setMessageQueue([]);
  };


  return (
    <div className="main-content">
      <div className="Draw">
        <div className="container">
          <div className="workspace">
            {contextHolder}


            <div className="palette">
              <Palette
                divClassName={paletteClassName}
                diagram={mydiagram}
                diagramVersion={diagramVersion}
              />
            </div>
            <DiagramContainer>
              <DiagramTop>
                <DiagramTopLeft>
                <FileName>파일 이름: {fileName}</FileName>
                <AlertBadge count={messageQueue.length} onClick={showAlertMessages}>
              <Avatar
                style={{
                  backgroundColor: "transparent",
                  verticalAlign: 'middle',
                }}
                icon={<BellOutlined
                  style={{
                    color: "black"
                  }}
                />} size="middle" />
            </AlertBadge>
            </DiagramTopLeft>
                <SaveButton>
                  <ModalButton
                    diagram={diagram}
                    showToggle={showToggle}
                    setShowToggle={setShowToggle}
                    isSave={isSave}
                    handleSaveDiagram={handleSaveDiagram}
                    setIsSave={setIsSave}
                    setFileName={setFileName}
                    finalToggleValue={finalToggleValue}
                    setFinalToggleValue={setFinalToggleValue}
                    onPopupChange={handlePopupChange}
                  />
                </SaveButton>
                <StyledButton onClick={handleSaveDiagram}>Save</StyledButton>

              </DiagramTop>
              <Modal
                title="저장할 파일의 이름을 입력하세요."
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
              >
                <Input
                  value={fileName}
                  onChange={handleChange}
                  placeholder="파일 이름"
                />
              </Modal>

              {showToggle &&
                showSelectToggle.value &&
                showSelectToggle.key.includes("EC2") &&
                !showSelectToggle.key.includes(" ") && (
                  <SelectEc2Toggle
                    diagram={diagram}
                    uniquekey={showSelectToggle.key}
                    finalToggleValue={finalToggleValue}
                    setFinalToggleValue={setFinalToggleValue}
                    onToggleSelect={handleNodeSelect}
                    readOnly
                  />
                )}
              {showToggle &&
                showSelectToggle.value &&
                showSelectToggle.key.includes("RDS") && (
                  <SelectRdsToggle
                    diagram={diagram}
                    uniquekey={showSelectToggle.key}
                    finalToggleValue={finalToggleValue}
                    setFinalToggleValue={setFinalToggleValue}
                    readOnly
                  />
                )}
              {showToggle &&
                showSelectToggle.value &&
                showSelectToggle.key.includes("Simple Storage Service") && (
                  <SelectS3Toggle
                    diagram={diagram}
                    uniquekey={showSelectToggle.key}
                    finalToggleValue={finalToggleValue}
                    setFinalToggleValue={setFinalToggleValue}
                    readOnly
                  />
                )}
              {showToggle &&
                showSelectToggle.value &&
                showSelectToggle.key.includes("AWS_WAF") && (
                  <SelectWafToggle
                    diagram={diagram}
                    uniquekey={showSelectToggle.key}
                    finalToggleValue={finalToggleValue}
                    setFinalToggleValue={setFinalToggleValue}
                    readOnly
                  />
                )}

              <StyledDiagram>
                <ReactDiagram
                  initDiagram={initDiagram}
                  divClassName={diagramClassName}
                />
              </StyledDiagram>
            </DiagramContainer>
            {isPopup ? (
              <RequirementPopup
                diagram={diagram}
                fileName={fileName}
                handlePopup={handlePopup} />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Draw;

const AlertBadge = styled(Badge)`
  text-align: center;
  align-items: center;
  margin-top: 20px;
  margin-left: 10px;
  padding-bottom: 10px;
  z-index: 21;
`

const SaveButton = styled.div`
  background-color: white;
  position: absolute;
  margin-top: 40px;
  margin-left: 10px;
  z-index: 20;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;
const DiagramTop = styled.div`
  display: flex;
`;

const FileName = styled.div`
  font-family: "Noto Sans KR", sans-serif !important;
  font-weight: 500;
  font-size: 15px;
  margin-top: 20px;
  margin-left: 20px;
  padding-top: 5px;
  padding-bottom: 10px;
`;

const DiagramTopLeft = styled.div`
  display: flex;
  /* border: 10px solid #d9d9d9; */
`
const StyledDiagram = styled.div`
  /* float: left; */
  /* margin-top: 3?0px; */
  width: 100%;
  height: 80vh; // 원하는 높이로 설정
`;

const StyledButton = styled.div`
  margin-top: 20px;
  position: absolute;
  right: 0;
  box-sizing: border-box;
  width: 70px;
  /* margin: 10px; */
  color: #809cda;

  border: 2px solid #bbbbda;
  border-radius: 7px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;

  line-height: 30px;
  align-items: center;
  text-align: center;

  cursor: pointer;
  &:hover {
    background: #809cda;
    color: #ffffff;
  }
`;
const DiagramContainer = styled.div`
  position: relative;
  display: inline;
  width: 75%;
  height: 75%;
`;