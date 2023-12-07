
import { DevCheck } from "../apis/fileAPI";


export async function handleSecurity(e, diagram, setAlertMessage) {
  if (e.isTransactionFinished) {
    const jsonString = e.model.toIncrementalJson(e);
    const data = JSON.parse(jsonString);
    checkForLog(diagram, setAlertMessage)

    // Handling node modifications separately
    if (data.modifiedNodeData) {
      for (let i = 0; i < data.modifiedNodeData.length; i++) {
        if (data.modifiedNodeData[i].text === "QuickSight" ||
            data.modifiedNodeData[i].text ===  "OpenSearch Service" ||
            data.modifiedNodeData[i].text === "Athena" ||
            data.modifiedNodeData[i].text === "S3"
        ) {
          await handleNode(data.modifiedNodeData[i], diagram, setAlertMessage);
        }
        }
      }
      
    }
  }


async function handleNode(node, diagram, setAlertMessage) {

  try {
    const message = {
      key: Date.now().toString(), // Unique key for each message
      message: node.text + " (이)가 암호화되지 않을 시, 무단 접근 및 변조 등을 통한 보험 위험이 존재할 수 있습니다.\
      " + node.text + "(을)를 암호화해주시기를 바랍니다."
    };
    console.log("hello", message);
    setAlertMessage({
      key: Date.now(), // 현재 타임스탬프를 key로 사용
      message: message.message,
      tag: "Info",
    });
   
  } catch (error) {
    console.error("API Error:", error);
  }
  
}


export async function checkForLog(diagram, setAlertMessage) {
  if (diagram.model.nodeDataArray.length > 0) {
    const hasQuickSightNode = diagram.model.nodeDataArray.some(node => node.text === "QuickSight");
    const hasOpenSearch = diagram.model.nodeDataArray.some(node => node.text === "OpenSearch Service");
    const hasAthena = diagram.model.nodeDataArray.some(node => node.text === "Athena");
    const hasS3 =  diagram.model.nodeDataArray.some(node => node.text === "S3");

    const message = {
      key: Date.now().toString(), // Unique key for each message
      hasmessage: " 로그 저장 매체가 있을 시, 무단 접근 및 변조 등을 통한 보험 위험이 존재할 수 있습니다."
     
    
    };
    if (hasQuickSightNode || hasOpenSearch || hasAthena || hasS3) {
      setAlertMessage({
        key: Date.now(), // 현재 타임스탬프를 key로 사용
        message: message.hasmessage,
        tag: "Info",
      });
    }

    /// dev 망이 있을 때 메세지 띄우기 

    const devMessage = {
      key: Date.now().toString(), // Unique key for each message
      hasmessage: "개발, 테스트 및 운영 환경은 분리되어야 하며 보호되어야 합니다."
    };

    try {
      const jsonString = diagram.model.toJson();
      const response = await DevCheck(jsonString);
      if ( response.data.status) {
        console.log("API Response:", response.data);
        setAlertMessage({
          key: Date.now(), // Use current timestamp as key
          message: devMessage.hasmessage,
          tag: "Info",
        });
      }
    } catch (error) {
      console.error("Error in DevCheck:", error);
      // Handle error appropriately (e.g., set an error message)
    }
  }
}

