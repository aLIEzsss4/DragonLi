import React, { useState, useEffect, useRef } from "react";
import { Moralis } from "moralis";
import { useWeb3ExecuteFunction } from "react-moralis";
//import { abi as contractAbi } from "../constants/abis/Token.json";
// import { abi as charContractAbi } from "../constants/abis/Character.json";
import charContractAbi from "../constants/abis/abi.json";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Box,
  Text,
  VStack,
  Button,
  Link,
  Input,
  Heading,
  FormControl,
  FormErrorMessage,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

import { Formik, Field, Form } from "formik";
const { default: axios } = require("axios");

const CHAR_CONTRACT = process.env.REACT_APP_CHAR_CONTRACT;
const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY; 

export default function Hashtro({ isServerInfo }) {
  // web3 functionality
  const { fetch, isFetching } = useWeb3ExecuteFunction();
  // Hashtro data
  const [hashtroId, setHashtroId] = useState(null);
  const [hashtroData, setHashtro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState();
  const [interactionData, setInteractionData] = useState();
  const [showErrorMessage, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showMessage, setMessage] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState({
    id: null,
  });

  const [allInfo,setAllInfo]=useState()

  const [imgSrc, setImgSrc] = useState("");

  const form = useRef();

  useEffect(() => {
    // if we get the ID to load then fetch that IDs data from chain
    // then dep `interactionData` means we update the display after feeding
    if (hashtroId) {
      fetchData(hashtroId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtroId, interactionData]); // <-- the above updates on these changing

  useEffect(() => {
    // updates the hashtro's state
    setHashtro(dataFetched);
  }, [dataFetched]); // <-- the above updates on this changing


  const updateMetadataFn=async ({
    level,
    hp,
    damage
  })=>{

     let paddedHex = (
        "0000000000000000000000000000000000000000000000000000000000000000" + allInfo.id
      ).slice(-64);

    let dateTime = Date.now();

    console.log(allInfo,'allInfo',level)

    let nftMetadata = {
      //dna: dna.join(""),
     
      ...allInfo,
      // name: _values.name ? _values.name : `#${_id}`,
      // image: _path,
      // id: _id,
      // date: dateTime,
      attributes:[
        // ...dataFetched.attributes,
        {
          "trait_type": "damage", 
          "value": damage,
           "display_type": "boost_number", 
        }, 
         {
          "trait_type": "hp", 
          "value": hp,
           "display_type": "boost_number", 
        }, 
         {
          "trait_type": "level", 
          "value":level ,
        }, 
        {
          "trait_type": "updateTime", 
          "value": dateTime,
           "display_type": "date", 
        }
      ]
    };

    let base64String = Buffer.from(JSON.stringify(nftMetadata)).toString(
        "base64",
      );

    return await axios
              .post(API_URL, [{
                path: `metadata/${paddedHex}.json`,
                content: base64String,
              }], {
                headers: {
                  "X-API-Key": API_KEY,
                  "content-type": "application/json",
                  accept: "application/json",
                },
              })
              .then((res) => {
                // successfully uploaded metadata to IPFS
                // let metaCID = res.data[0].path.split("/")[4];
                console.log("updateMetadataFn FILE PATHS:", res.data);

                return res.data?.[0]?.path

                // step 3. transfer reference to metadata on-chain and to db (optional)
                // on-chain: interface with smart contract; mint uploaded asset as NFT
                // mintCharacter(metaCID, id, _formValues); // <-- '+1' or 'amount' to be minted, currently minting one at a time
                // moralis db: save ref to IPFS metadata file
                //saveToDb(metaCID, imageCID, _totalFiles);
              })
              .catch((err) => {
                // setLoading(false);
                // setError(true);
                // setErrorMessage(err);
                console.log(err);
              });

  }
  /*
  // interact with Hastro token (NFT)
  async function feedData(_id) {
    const options = {
      abi: contractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "feed",
      params: {
        tokenId: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => setInteractionData(response),
      onComplete: () => console.log("Fed"),
      onError: () => console.log("Error", error),
    });
  }
  */
  /* 
  // fetch Hastro token (NFT)
  async function fetchData(_id) {
    if (isServerInfo) {
      const options = {
        abi: contractAbi,
        contractAddress: CHAR_CONTRACT,
        functionName: "getTokenDetails",
        params: {
          tokenId: _id,
        },
      };

      await fetch({
        params: options,
        onSuccess: (response) => setDataFetched(response),
        onComplete: () => console.log("Fetched"),
        onError: (error) => console.log("Error", error),
      });
    }
  }
  */

  const messageMarkup = (
    <Box>
      <Alert status="success">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Levelled-up!</AlertTitle>
          <AlertDescription display="block">
            Character Now Level{" "}
            {hashtroData ? hashtroData.attributes.level : ""}! 🏅
          </AlertDescription>
        </Box>
        <CloseButton
          position="absolute"
          right="8px"
          top="8px"
          onClick={() => setMessage(false)}
        />
      </Alert>
    </Box>
  );

  const errorMarkup = (_error) => {
    return (
      <Box>
        <Alert status="error">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription display="block">{_error}.</AlertDescription>
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setError(false)}
          />
        </Alert>
      </Box>
    );
  };

  // Realtime UI
  function gameRenderer(_data) {
    if (!hashtroData) {
      return (
        <VStack>
          <Text>Nothing Loaded</Text>
        </VStack>
      );
    } else {
      //console.log(hashtroData);
      /*       let now = new Date();
      let deathStatus = "ALIVE";

      let deathTime = null;
      let lastMeal = null;

      if (hashtroData != null) {
        deathTime = new Date(
          (parseInt(hashtroData.attributes.lastMeal) +
            parseInt(hashtroData.attributes.endurance)) *
            1000,
        );
        lastMeal = new Date(parseInt(hashtroData.attributes.lastMeal) * 1000);
      }
      if (now > deathTime) {
        deathStatus = "DEAD";
      }
 */
      return (
        <VStack>
          <Box mt={4} mb={4}>
            <Heading as="h4" size="md">
              {hashtroData.id}
            </Heading>
          </Box>
          <Box>
            <Text>Level: {hashtroData.attributes.level}</Text>
          </Box>
          <Box>
            <Text>DNA: {hashtroData.attributes.dna}</Text>
          </Box>
          <Box>
            <Text>Evac: {hashtroData.attributes.evac}</Text>
          </Box>
          <Box>
            <Text>Rarity: {hashtroData.attributes.rarity}</Text>
          </Box>
          <Box>
            {/* <Text>Rarity: {hashtroData.attributes.rarity}</Text> */}
            <img src={imgSrc} />
          </Box>
          <Box>
            <Text>
              Metadata:{" "}
              <Link href={hashtroData.attributes.tokenURI} isExternal>
                link to JSON <ExternalLinkIcon mx="2px" />
              </Link>
            </Text>
          </Box>
        </VStack>
      );
    }
  }

  async function readMetadata(_response) {
    console.log(_response);
    // fetch data on NFT from JSON metadata
    let dataMapping = {
      id: _response.id,
      attributes: {
        evac: _response.evac,
        tokenURI: _response.tokenURI,
        dna: _response.dna,
        level: _response.level,
        rarity: _response.rarity,
      },
    };
    setDataFetched(dataMapping); //<-- temp
    setHashtro(dataMapping);
    console.log(dataMapping);

    // alternatiely fetch data on NFT from JSON metadata
    axios
      .get(_response.tokenURI)
      .then((res) => {
        console.log(res, 'res tokenURI')

        setImgSrc(res.data?.image)
        let dataMapping = {};
    setAllInfo(res.data)

        // dataMapping = res.data[0];
        // dataMapping.attributes.lastMeal = _response.lastMeal;
        // setDataFetched(dataMapping);
        // gameRenderer(null);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /*   // interact with Hastro token (NFT)
  async function levelData(_id) {
    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "levelUp",
      params: {
        _id: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => setInteractionData(response),
      onComplete: () => console.log("Character Levelled-up"),
      onError: (error) => console.log("Error", error),
    });
  }
 */
  async function levelData(_hostContract, _tokenId) {

    // let oldLevel=allInfo.attributes?.find(item=>item.trait_type=='level')?.value

    let mapList={}
    
    await allInfo.attributes?.forEach(item=>{

    mapList[item.trait_type]=item.value

    
    })

    const newLevel = mapList.level;
    const newHP = mapList.hp;
    const newDamage = mapList.damage;

    console.log(mapList,'mapList')

    const newUrl=await updateMetadataFn({
      ...mapList,
      level:mapList.level+1,
    })

    const web3 = await Moralis.enableWeb3();
    const params = {
      hostContract: _hostContract,
      tokenId:Number(_tokenId) ,
      newUrl,
      newLevel:mapList.level+1,
      newHP,
      newDamage
    };
    console.log(params,'params')
    const signedTransaction = await Moralis.Cloud.run("updateMetaData", params);
    const fulfillTx = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction,
    );
    setMessage(true);
    fetchData(hashtroId);
    setLoading(false);
    console.log(fulfillTx);
  }

  // fetch Hastro token (NFT)
  async function fetchData(_id) {
    const options = {
      abi: charContractAbi,
      contractAddress: CHAR_CONTRACT,
      functionName: "getTokenDetails",
      params: {
        _id: _id,
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => readMetadata(response),
      onComplete: () => console.log("Character Fetched"),
      onError: (error) => console.log("Error", error),
    });
  }

  // date formatting
  function addLeadingZeros(n) {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  }

  // Render date data
  function deathTimeRender(_deathTime) {
    return (
      addLeadingZeros(_deathTime.getDate()) +
      "/" +
      addLeadingZeros(_deathTime.getMonth() + 1) +
      "/" +
      _deathTime.getFullYear() +
      " " +
      addLeadingZeros(_deathTime.getHours()) +
      ":" +
      addLeadingZeros(_deathTime.getMinutes()) +
      ":" +
      addLeadingZeros(_deathTime.getSeconds())
    );
  }

  // UI interactions
  const handleSubmit = async (e) => {
    console.log("FORM INPUT:", e);

    //e.preventDefault();
    setHashtroId(e.id);
  };
  function onLevelUp(e) {
    e.preventDefault();
    setLoading(true);

    if (hashtroId) {
      levelData(CHAR_CONTRACT, hashtroId);
    }
  }
  // UI
  return (
    <Box style={{ display: "flex", gap: "10px" }}>
      <Box>
        <VStack>
          <Heading className="h1" mb={2}>
            Test NFT Character
          </Heading>
          <Formik
            initialValues={initialFormValues}
            validateOnMount={true}
            enableReinitialize={true}
            onSubmit={async (values, { resetForm }) => {
              handleSubmit(values, { resetForm });
            }}
          >
            {(props) => (
              <Form ref={form}>
                <Box mb={2}>
                  {showMessage ? messageMarkup : ""}
                  {showErrorMessage ? errorMarkup(errorMessage) : ""}
                </Box>
                <Field name="id">
                  {({ field, form }) => (
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        id="id"
                        className="first"
                        placeholder="Character ID"
                        mb={2}
                        borderRadius={1}
                        variant="outline"
                        borderColor="teal"
                        borderStyle="solid"
                        lineHeight={0.2}
                        value={field.value ? field.value : ""}
                      />
                      <FormErrorMessage>{form.errors.id}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Button
                  name="fetch"
                  //onClick={onSubmit}
                  disabled={dataFetched || isFetching ? true : false}
                  colorScheme="green"
                  size="lg"
                  variant="solid"
                  leftIcon={"👨‍🚀"}
                  type="submit"
                >
                  Fetch
                </Button>
                <Box className="x">
                  <Button
                    name="levelup"
                    onClick={onLevelUp}
                    isLoading={loading}
                    disabled={!dataFetched || loading ? true : false}
                    colorScheme="purple"
                    size="lg"
                    variant="solid"
                    leftIcon={"⇧"}
                    className="y"
                  >
                    Level Up
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </VStack>
        <>{gameRenderer(hashtroData)}</>
      </Box>
    </Box>
  );
}
