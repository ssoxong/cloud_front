import React, { useState, useEffect } from "react";
import "../../styles/SelectToggle.css";
import axios from 'axios';

const baseOptions = [
    "PostgreSQL",
    "MySQL",
    "SQLServer",
    "AuroraPostgresMySQL",
    "MariaDB",
    "Oracle"
  ];

const onTypeOptions = [
  { value: "T3.1", label: "on-demand" }
];
 

function rdsPrice(priceElement) {
  let dbengine=priceElement[0];
  let dbinstance=priceElement[1];
  let dbsize=priceElement[2];
  console.log("engine: "+dbengine+"instance: "+dbinstance+"size: "+dbsize);
  return new Promise((resolve, reject) => {
    axios({
      url: '/pricing-api/rds',
      method: 'post',
      data: {
        "dbEngine": dbengine,
        "instanceType": dbinstance+"."+dbsize,
      },
      baseURL: 'http://localhost:8080',
    })
    .then(function (response) {
      // 가정: response에 원하는 데이터가 있음
      console.log("response",response.data[0].priceUSD);
      resolve([response.data[0].priceUSD]);
    })
    .catch(function (error) {
      console.error("Error occurred:", error);
      reject(error);
    });
  });
}


function fetchEngineData(engine, instanceType, setData, setLoading, setError){
  return new Promise((resolve, reject) => {setLoading(true);
    axios({
      url: '/db-api/rds',
      method: 'post',
      data: {
        "engine": engine,
        "instanceType":instanceType
      },
      baseURL: 'http://localhost:8080',
    })
    .then(function (response) {
      setData(response.data);
      console.log(response.data);
      
      const transformData = (data) => {
        const { instanceType, instanceSize } = data;
        const resultMap = {};
    
        instanceType.forEach((type, index) => {
            if (!resultMap[type]) {
                resultMap[type] = [];
            }
            resultMap[type].push(instanceSize[index]);
        });
    
        return resultMap;
    };

    if(engine == "PostgreSQL") {
        const transformedData=transformData(response.data);
        resolve(transformedData);
    }
    
    if(engine == "MySQL") {
        const transformedData=transformData(response.data);
        resolve(transformedData);
    }

    if (engine == "SQLServer") {
        const transformedData=transformData(response.data);
        resolve(transformedData);    }

    if (engine == "AuroraPostgresMySQL") {
        const transformedData=transformData(response.data);
        resolve(transformedData);    }
    
    if (engine == "MariaDB") {
        const transformedData=transformData(response.data);
        resolve(transformedData);    }
    
    if (engine == "Oracle") {
        const transformedData=transformData(response.data);
        resolve(transformedData);    }
        
        setLoading(false);

    })
    .catch(function (error) {
      console.error("Error occurred:", error);
      setError(error);
      setLoading(false);
      reject(error);
    });
  });
}


const SelectRdsToggle = ({ diagram, uniquekey, finalToggleValue, setFinalToggleValue}) => {
  
  const [toggle1Value, setToggle1Value] = useState(null);
  const [toggle2Value, setToggle2Value] = useState(null);
  const [toggle3Value, setToggle3Value] = useState(null);


  const [uniqueKey,setUniqueKey] = useState(null);

  const [toggle2Options, setToggle2Options] = useState([]);
  const [toggle3Options, setToggle3Options] = useState([]);
  const [toggle4Options, setToggle4Options] = useState([]);
  const [price ,setPrice] = useState(null);
  const [select, setSelect] = useState(["Engine", "InstanceType","Size"]);

  const [dbOption, setDbOption] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  //삭제시 다이어그램에 있는 노드 데이터 삭제
  const handleDeletKey = (uniqueKey) => {
    setFinalToggleValue((prev) => {
      const newState = {...prev};
      delete newState[uniqueKey];
      return newState;
    });
  }

  diagram.addDiagramListener("SelectionDeleting", function (e) {
      e.subject.each(function (part) {
        handleDeletKey(part.key);
      });
  });

  

  //첫번째 토글이 set 되었을때 db에 인스턴스와 size 질의
  useEffect(() => {
    if (toggle1Value) {
      async function fetchOptions() {
        try {
          console.log("엔진",toggle1Value);
          const options = await fetchEngineData(toggle1Value, null, setData, setLoading, setError);
          console.log("options",options);
          setToggle2Options(Object.keys(options));
          setDbOption(options);
          setToggle2Value(null);
          setToggle3Value(null);
        } catch (err) {
          console.error("Error fetching engine data:", err);
        }
      }

      fetchOptions();
    } else {
      setToggle2Options([]);
      setToggle2Value(null);
    }
  }, [toggle1Value]);
  
  //선택한 노드의 key 저장
  useEffect(() => {
    setUniqueKey(uniquekey);
    setToggle1Value(null);
    setToggle2Value(null);
    setToggle3Value(null);
  },[uniquekey]);
  
  
  //toggle2 즉 size를 set해준다
  useEffect(() => {
    if (toggle2Value) {
    setToggle3Options(dbOption[toggle2Value]);
    setToggle3Value(null);
    }
  }, [toggle2Value]);


  useEffect(() => {          //이미 유니크키가 세팅이 완료된경우일듯
    if (
        finalToggleValue[uniqueKey] &&
        finalToggleValue[uniqueKey].length === 4  
        
      ) {
        console.log("setselect 전 finaltoggle입니당",finalToggleValue[uniqueKey][1]);
        setSelect([
          finalToggleValue[uniqueKey][0],
          finalToggleValue[uniqueKey][1],
          finalToggleValue[uniqueKey][2],
        ]);
        setToggle1Value(finalToggleValue[uniqueKey][0]);
        //setToggle2Value(finalToggleValue[uniqueKey][1]);  //이걸 없애면 뜨는데
        setPrice(finalToggleValue[uniqueKey][3]);
      } else {
        setPrice("Loading");
        setSelect(["Engine", "InstanceType","Size"]);
      }
  }, [finalToggleValue, uniqueKey]);

  useEffect(() => {
    console.log("hello", finalToggleValue[uniqueKey]);
      const fetchPrice = async () => {
          if (finalToggleValue[uniqueKey] 
            && finalToggleValue[uniqueKey].length == 4
            && finalToggleValue[uniqueKey][0] != "Engine"
            && finalToggleValue[uniqueKey][1] != "IntanceType"
            && finalToggleValue[uniqueKey][2] != "Size"
            && finalToggleValue[uniqueKey][3] === "Loading") {
              try {
                console.log(finalToggleValue[uniqueKey], "가격인데...?? 이까지 오나??" ); // 이 부분 추가

                const calculatedPrice = await rdsPrice(finalToggleValue[uniqueKey]);
                console.log("calcul", calculatedPrice);

                setFinalToggleValue(prev => {
                  if (!prev[uniqueKey] || !Array.isArray(prev[uniqueKey])) {
                    return prev; // 이전 상태를 반환하거나 초기 상태를 설정할 수 있습니다.
                  }
                  const updated = [...prev[uniqueKey]];
                  updated[3] = calculatedPrice;
                  return { ...prev, [uniqueKey]: updated };
                });
                setPrice(calculatedPrice);
                setSelect([                 
                  finalToggleValue[uniqueKey][0],
                  finalToggleValue[uniqueKey][1],
                  finalToggleValue[uniqueKey][2],
                ]);   
              } catch (err) {
                console.error("Error fetching platform data:", err);
              }
          }   

          else if (       
            finalToggleValue
            && finalToggleValue[uniqueKey]
            && finalToggleValue[uniqueKey].length === 4
          ) {
            console.log("setselect 전 finaltoggle입니당",finalToggleValue[uniqueKey]);
            setSelect([                 
              finalToggleValue[uniqueKey][0],
              finalToggleValue[uniqueKey][1],
              finalToggleValue[uniqueKey][2],
            ]);                          
            setToggle1Value(finalToggleValue[uniqueKey][0]);
            //setToggle2Value(finalToggleValue[uniqueKey][1]);
            setPrice(finalToggleValue[uniqueKey][3]);
          } else {
            
            setPrice("Loading");
            setSelect(["Engine", "InstanceType","Size"]);
          }
        
        }
        fetchPrice();
  
  }, [finalToggleValue, uniqueKey]);


  const handleChange = (index, event) => {
    const newValue = event.target.value;
    if (index === 0) {
      setToggle1Value(newValue);
      setFinalToggleValue(prev => {
        const updated =  ["Engine","InstanceType","Size"]; //여기서 문제가 말생하네...?? 왜 발생하지
        updated[index] = newValue;
        updated[3] ="Loading";
        return { ...prev, [uniqueKey]: updated };
      });
      console.log("0번 성공저장");
    } else if (index === 1) {
      console.log("전");
      setToggle2Value(newValue);
      setFinalToggleValue(prev => {
        const updated = [...prev[uniqueKey]];
        updated[index] = newValue;
        updated[2] = "Size";
        updated[3] ="Loading";
        return { ...prev, [uniqueKey]: updated };
      });
      setToggle3Value(null);
      console.log("1번째 성공 저장");
    } else if (index === 2) {
      setToggle3Value(newValue);
      setToggle4Options(onTypeOptions);
      setFinalToggleValue(prev => {
        const updated = [...prev[uniqueKey]];
        updated[index] = newValue;
        updated[3] ="Loading";
        console.log("Updated finalToggleValue:", updated); // 이 부분 추가
        return { ...prev, [uniqueKey]: updated };
      });
    } 
  };


  console.log("FinalToggle",finalToggleValue);

  const renderToggle = (index, Select, value, options) => {
    return (
      <select
        value={value || ""}
        onChange={(e) => handleChange(index, e)}
      >
        <option value="" disabled>{Select}</option>
      {options.map((option, idx) => (
        <option key={idx}>
          {option}
        </option>
      ))}
    </select>
      );
    };

  const Item = ({price}) =>{

    if(!price || price.length < 1) {
      return null;
    }
    return (
      <div>
        {price[0]+"USD / Hour"}
      </div>
    );
    
  }
  return (
    <div className ="ec2">
      <div className="toggle-component">
        {renderToggle(0, select[0], toggle1Value, baseOptions)}
        {renderToggle(1, select[1], toggle2Value, toggle2Options)}
        {renderToggle(2, select[2], toggle3Value, toggle3Options)}
        

        <div className="price">
          <Item price={price} />
        </div>
      </div>
      
    </div>
  );
};

export default React.memo(SelectRdsToggle);




